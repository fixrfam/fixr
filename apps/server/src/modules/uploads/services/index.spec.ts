import { MAX_AVATAR_UPLOAD_SIZE_BYTES } from "@fixr/schemas/uploads";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const { dbMock, repo } = vi.hoisted(() => ({
	dbMock: {} as ReturnType<
		typeof import("@/test/helpers/query-builder-mock").createDbMock
	>,
	repo: { createPresignedUpload: vi.fn() },
}));

vi.mock("@fixr/db/connection", async (importOriginal) => {
	const { createDbMock } = await import("@/test/helpers/query-builder-mock");
	Object.assign(dbMock, createDbMock());
	return { ...(await importOriginal<object>()), db: dbMock.db };
});
vi.mock("../repositories", () => ({ UploadsRepository: repo }));

const { UploadsService } = await import(".");

const file = { fileName: "a.jpg", contentType: "image/jpeg", size: 1024 };

beforeEach(() => {
	repo.createPresignedUpload.mockResolvedValue({
		id: "up1",
		uploadUrl: "https://r2/put",
		key: "k",
		url: "https://cdn/k",
		expiresIn: 600,
	});
});

afterEach(() => {
	vi.clearAllMocks();
	dbMock.reset();
});

describe("UploadsService.createPresignedUpload", () => {
	it("presigns an avatar for the user without any company scope", async () => {
		const reply = createFakeReply();

		await UploadsService.createPresignedUpload({
			purpose: "avatar",
			data: file,
			userId: "u1",
			response: asReply(reply),
		});

		expect(repo.createPresignedUpload).toHaveBeenCalledWith({
			purpose: "avatar",
			companyId: undefined,
			employeeId: undefined,
			userId: "u1",
			...{ fileName: "a.jpg", contentType: "image/jpeg", size: 1024 },
		});
		expect(reply.state.body).toMatchObject({
			code: "create_avatar_presign_success",
			data: { id: "up1" },
		});
	});

	it("rejects an avatar above the avatar size limit", async () => {
		await expect(
			UploadsService.createPresignedUpload({
				purpose: "avatar",
				data: { ...file, size: MAX_AVATAR_UPLOAD_SIZE_BYTES + 1 },
				userId: "u1",
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "upload_size_exceeded", status: 413 });
		expect(repo.createPresignedUpload).not.toHaveBeenCalled();
	});

	it.each([
		["service-orders", "create_upload_presign_success"],
		["models", "create_model_image_presign_success"],
	] as const)("scopes a %s upload to the employee's company", async (purpose, code) => {
		dbMock.queue([{ id: "emp1" }]);
		const reply = createFakeReply();

		await UploadsService.createPresignedUpload({
			purpose,
			data: file,
			userId: "u1",
			companyId: "c1",
			response: asReply(reply),
		});

		expect(repo.createPresignedUpload).toHaveBeenCalledWith(
			expect.objectContaining({ purpose, companyId: "c1", employeeId: "emp1" })
		);
		expect(reply.state.body).toMatchObject({ code });
	});

	it("rejects a user who is not an employee of the JWT company", async () => {
		dbMock.queue([]);

		await expect(
			UploadsService.createPresignedUpload({
				purpose: "service-orders",
				data: file,
				userId: "u1",
				companyId: "c1",
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "company_not_found", status: 404 });
		expect(repo.createPresignedUpload).not.toHaveBeenCalled();
	});

	// Known gap (tracked in the #95 findings): any well-formed MIME type is accepted,
	// including text/html; there is no allowlist of image types.
	it("currently accepts any content type", async () => {
		await UploadsService.createPresignedUpload({
			purpose: "avatar",
			data: { ...file, contentType: "text/html" },
			userId: "u1",
			response: asReply(createFakeReply()),
		});

		expect(repo.createPresignedUpload).toHaveBeenCalled();
	});
});
