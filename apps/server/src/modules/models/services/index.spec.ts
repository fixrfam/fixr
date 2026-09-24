import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const { dbMock, repo, pagination } = vi.hoisted(() => ({
	dbMock: {} as ReturnType<
		typeof import("@/test/helpers/query-builder-mock").createDbMock
	>,
	repo: {
		buildListFilter: vi.fn(() => "FILTER"),
		buildOrder: vi.fn(() => "ORDER"),
		queryPrimaryImages: vi.fn(),
		generateImagePresignedUrl: vi.fn(),
		attachPresignedUrlsToImages: vi.fn(),
		queryModelBySlug: vi.fn(),
		queryModelImages: vi.fn(),
		queryModelById: vi.fn(),
		queryBySlugAndCompany: vi.fn(),
		queryMakerById: vi.fn(),
		insertModel: vi.fn(),
		insertModelImage: vi.fn(),
		updateModel: vi.fn(),
		deleteModel: vi.fn(),
		deleteR2Object: vi.fn(),
		deleteModelImageRecord: vi.fn(),
	},
	pagination: { getPaginatedRecords: vi.fn(), getPaginatedCount: vi.fn() },
}));

vi.mock("@fixr/db/connection", async (importOriginal) => {
	const { createDbMock: create } = await import(
		"@/test/helpers/query-builder-mock"
	);
	Object.assign(dbMock, create());
	return { ...(await importOriginal<object>()), db: dbMock.db };
});
vi.mock("../repositories", () => ({
	ModelsRepository: repo,
	modelListJoins: [],
	modelMinimalListSelect: {},
}));
vi.mock("../../../core/lib/pagination", () => pagination);

const { ModelsService } = await import(".");

const companyId = createId();
const otherCompanyId = createId();
const jwt = { id: createId(), company: { id: companyId, subdomain: "fixr" } };
const noCompany = { id: createId() };

const model = (overrides: Record<string, unknown> = {}) => ({
	id: createId(),
	name: "Galaxy S24",
	slug: "galaxy-s24",
	status: null,
	companyId,
	...overrides,
});

const flatRecord = (overrides: Record<string, unknown> = {}) => ({
	id: createId(),
	name: "Galaxy",
	slug: "galaxy",
	status: null,
	price: null,
	released: null,
	makerId: "m1",
	makerName: "Samsung",
	makerSlug: "samsung",
	categoryId: null,
	categoryName: null,
	categorySlug: null,
	...overrides,
});

beforeEach(() => {
	repo.queryModelImages.mockResolvedValue([]);
	repo.attachPresignedUrlsToImages.mockImplementation(async (images) =>
		images.map((i: object) => ({ ...i, presignedUrl: "https://signed" }))
	);
	repo.generateImagePresignedUrl.mockImplementation(async (key) =>
		key ? `https://signed/${key}` : null
	);
	repo.queryPrimaryImages.mockResolvedValue(new Map());
});

afterEach(() => {
	vi.clearAllMocks();
	dbMock.reset();
});

/** Every method guards the company the same way; run the shared cases once per method. */
const guardedCalls = {
	listModels: (userJwt: unknown, subdomain = "fixr") =>
		ModelsService.listModels({
			userJwt: userJwt as never,
			subdomain,
			page: 1,
			response: asReply(createFakeReply()),
		}),
	getModelBySlug: (userJwt: unknown, subdomain = "fixr") =>
		ModelsService.getModelBySlug({
			userJwt: userJwt as never,
			subdomain,
			slug: "x",
			response: asReply(createFakeReply()),
		}),
	createModel: (userJwt: unknown, subdomain = "fixr") =>
		ModelsService.createModel({
			userJwt: userJwt as never,
			subdomain,
			data: { name: "X", makerId: "m" },
			response: asReply(createFakeReply()),
		}),
	patchModel: (userJwt: unknown, subdomain = "fixr") =>
		ModelsService.patchModel({
			userJwt: userJwt as never,
			subdomain,
			modelId: "m",
			data: {},
			response: asReply(createFakeReply()),
		}),
	deleteModel: (userJwt: unknown, subdomain = "fixr") =>
		ModelsService.deleteModel({
			userJwt: userJwt as never,
			subdomain,
			modelId: "m",
			response: asReply(createFakeReply()),
		}),
	createModelImage: (userJwt: unknown, subdomain = "fixr") =>
		ModelsService.createModelImage({
			userJwt: userJwt as never,
			subdomain,
			modelId: "m",
			data: { uploadId: "u" },
			response: asReply(createFakeReply()),
		}),
	deleteModelImage: (userJwt: unknown, subdomain = "fixr") =>
		ModelsService.deleteModelImage({
			userJwt: userJwt as never,
			subdomain,
			modelId: "m",
			imageId: "i",
			response: asReply(createFakeReply()),
		}),
};

describe.each(
	Object.entries(guardedCalls)
)("ModelsService.%s guards", (_name, call) => {
	it("rejects a user without company", async () => {
		await expect(call(noCompany)).rejects.toMatchObject({
			code: "company_not_found",
		});
	});

	it("rejects another company's subdomain", async () => {
		await expect(call(jwt, "other")).rejects.toMatchObject({
			code: "not_allowed",
			status: 403,
		});
		expect(repo.queryModelById).not.toHaveBeenCalled();
		expect(pagination.getPaginatedRecords).not.toHaveBeenCalled();
	});
});

describe.each([
	"patchModel",
	"deleteModel",
	"createModelImage",
	"deleteModelImage",
] as const)("ModelsService.%s tenant isolation", (name) => {
	it("reports another company's model as not found and never touches it", async () => {
		repo.queryModelById.mockResolvedValue(model({ companyId: otherCompanyId }));

		await expect(guardedCalls[name](jwt)).rejects.toMatchObject({
			code: "model_not_found",
			status: 404,
		});
		expect(repo.updateModel).not.toHaveBeenCalled();
		expect(repo.deleteModel).not.toHaveBeenCalled();
		expect(repo.insertModelImage).not.toHaveBeenCalled();
		expect(repo.deleteModelImageRecord).not.toHaveBeenCalled();
	});

	it("does not let a single tenant modify a shared catalog model", async () => {
		repo.queryModelById.mockResolvedValue(model({ companyId: null }));

		await expect(guardedCalls[name](jwt)).rejects.toMatchObject({
			code: "not_allowed",
			status: 403,
		});
	});

	it("reports a missing model as not found", async () => {
		repo.queryModelById.mockResolvedValue(null);

		await expect(guardedCalls[name](jwt)).rejects.toMatchObject({
			code: "model_not_found",
		});
	});
});

describe("ModelsService.listModels", () => {
	const list = (params: Record<string, unknown> = {}) => {
		const reply = createFakeReply();
		return {
			reply,
			promise: ModelsService.listModels({
				userJwt: jwt,
				subdomain: "fixr",
				page: 1,
				response: asReply(reply),
				...params,
			}),
		};
	};

	it("scopes the filter to the user's company and forwards every filter", async () => {
		pagination.getPaginatedRecords.mockResolvedValue([]);
		pagination.getPaginatedCount.mockResolvedValue(0);

		await list({
			query: "gal",
			makerId: "m",
			categoryId: "c",
			status: "Available",
			sort: "name",
		}).promise;

		expect(repo.buildListFilter).toHaveBeenCalledWith(companyId, {
			query: "gal",
			makerId: "m",
			categoryId: "c",
			status: "Available",
		});
		expect(repo.buildOrder).toHaveBeenCalledWith("name");
	});

	it("returns an empty page", async () => {
		pagination.getPaginatedRecords.mockResolvedValue([]);
		pagination.getPaginatedCount.mockResolvedValue(0);

		const { reply, promise } = list();
		await promise;

		expect(reply.state.body).toMatchObject({
			data: { records: [], pagination: { total_records: 0, total_pages: 0 } },
		});
	});

	it("rejects a page past the end", async () => {
		pagination.getPaginatedRecords.mockResolvedValue([]);
		pagination.getPaginatedCount.mockResolvedValue(3);

		await expect(list({ page: 2 }).promise).rejects.toMatchObject({
			code: "page_out_of_bounds",
		});
	});

	it("maps flat rows, defaults status and attaches the primary image url", async () => {
		const withImage = flatRecord({
			categoryId: "c1",
			categoryName: "Phone",
			categorySlug: "phone",
		});
		const withoutImage = flatRecord({ status: "Rumored" });
		pagination.getPaginatedRecords.mockResolvedValue([withImage, withoutImage]);
		pagination.getPaginatedCount.mockResolvedValue(2);
		repo.queryPrimaryImages.mockResolvedValue(
			new Map([[withImage.id, "key-1"]])
		);

		const { reply, promise } = list({ perPage: 10 });
		await promise;

		expect(repo.queryPrimaryImages).toHaveBeenCalledWith([
			withImage.id,
			withoutImage.id,
		]);
		const { records, pagination: page } = (reply.state.body as { data: never })
			.data as {
			records: Record<string, unknown>[];
			pagination: Record<string, unknown>;
		};
		expect(records[0]).toMatchObject({
			status: "Available",
			maker: { id: "m1", name: "Samsung", slug: "samsung" },
			category: { id: "c1", name: "Phone", slug: "phone" },
			imageUrl: "https://signed/key-1",
		});
		expect(records[1]).toMatchObject({
			status: "Rumored",
			category: null,
			imageUrl: null,
		});
		expect(page).toMatchObject({ next_page: null, prev_page: null });
	});

	it("rejects (instead of leaving a dangling promise) when presigning an image fails", async () => {
		pagination.getPaginatedRecords.mockResolvedValue([flatRecord()]);
		pagination.getPaginatedCount.mockResolvedValue(1);
		repo.generateImagePresignedUrl.mockRejectedValue(new Error("R2 down"));

		await expect(list().promise).rejects.toThrow("R2 down");
	});
});

describe("ModelsService.getModelBySlug", () => {
	it("looks the slug up within the user's company (and the shared catalog)", async () => {
		repo.queryModelBySlug.mockResolvedValue(model());
		repo.queryModelImages.mockResolvedValue([
			{ id: "i1", isPrimary: false, key: "k1" },
			{ id: "i2", isPrimary: true, key: "k2" },
		]);
		const reply = createFakeReply();

		await ModelsService.getModelBySlug({
			userJwt: jwt,
			subdomain: "fixr",
			slug: "galaxy-s24",
			response: asReply(reply),
		});

		expect(repo.queryModelBySlug).toHaveBeenCalledWith("galaxy-s24", companyId);
		expect(reply.state.body).toMatchObject({
			code: "get_model_success",
			data: { status: "Available", imageUrl: "https://signed/k2" },
		});
	});

	it("returns 404 for an unknown slug", async () => {
		repo.queryModelBySlug.mockResolvedValue(null);

		await expect(
			ModelsService.getModelBySlug({
				userJwt: jwt,
				subdomain: "fixr",
				slug: "nope",
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "model_not_found", status: 404 });
	});
});

describe("ModelsService.createModel", () => {
	beforeEach(() => {
		repo.queryMakerById.mockResolvedValue({ id: "m1" });
		repo.queryBySlugAndCompany.mockResolvedValue(undefined);
	});

	it("builds the record with slug, url, company and only the provided fields", async () => {
		const reply = createFakeReply();

		await ModelsService.createModel({
			userJwt: jwt,
			subdomain: "fixr",
			data: {
				name: "Galaxy S24 Ultra",
				makerId: "m1",
				os: undefined,
				cpu: "Snapdragon",
			},
			response: asReply(reply),
		});

		const [values] = repo.insertModel.mock.calls[0]!;
		expect(values).toEqual({
			id: expect.any(String),
			slug: "galaxy-s24-ultra",
			url: "/models/galaxy-s24-ultra",
			companyId,
			name: "Galaxy S24 Ultra",
			makerId: "m1",
			cpu: "Snapdragon",
		});
		expect(values).not.toHaveProperty("os");
		expect(reply.state.statusCode).toBe(201);
		expect(reply.state.body).toMatchObject({
			data: { id: values.id, slug: "galaxy-s24-ultra" },
		});
	});

	it("rejects an unknown maker", async () => {
		repo.queryMakerById.mockResolvedValue(undefined);

		await expect(
			ModelsService.createModel({
				userJwt: jwt,
				subdomain: "fixr",
				data: { name: "X", makerId: "ghost" },
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "maker_not_found" });
		expect(repo.insertModel).not.toHaveBeenCalled();
	});

	it("rejects a duplicate slug in the same company", async () => {
		repo.queryBySlugAndCompany.mockResolvedValue({ id: "existing" });

		await expect(
			ModelsService.createModel({
				userJwt: jwt,
				subdomain: "fixr",
				data: { name: "Galaxy", makerId: "m1" },
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "model_slug_conflict", status: 409 });
		expect(repo.queryBySlugAndCompany).toHaveBeenCalledWith(
			"galaxy",
			companyId
		);
	});
});

describe("ModelsService.patchModel", () => {
	beforeEach(() => {
		repo.queryModelById.mockResolvedValue(model());
	});

	it("only updates the fields that were sent", async () => {
		await ModelsService.patchModel({
			userJwt: jwt,
			subdomain: "fixr",
			modelId: "m",
			data: { name: "New name", price: undefined },
			response: asReply(createFakeReply()),
		});

		expect(repo.updateModel).toHaveBeenCalledWith("m", {
			name: "New name",
			price: null,
		});
	});

	it("skips the write for an empty patch but still returns the model", async () => {
		const reply = createFakeReply();

		await ModelsService.patchModel({
			userJwt: jwt,
			subdomain: "fixr",
			modelId: "m",
			data: {},
			response: asReply(reply),
		});

		expect(repo.updateModel).not.toHaveBeenCalled();
		expect(reply.state.body).toMatchObject({ code: "patch_model_success" });
	});
});

describe("ModelsService.deleteModel", () => {
	it("deletes an owned model", async () => {
		repo.queryModelById.mockResolvedValue(model({ id: "m" }));

		await ModelsService.deleteModel({
			userJwt: jwt,
			subdomain: "fixr",
			modelId: "m",
			response: asReply(createFakeReply()),
		});

		expect(repo.deleteModel).toHaveBeenCalledWith("m");
	});
});

describe("ModelsService.createModelImage", () => {
	beforeEach(() => {
		repo.queryModelById.mockResolvedValue(model({ id: "m" }));
	});

	it("rejects an unknown upload", async () => {
		dbMock.queue([]);

		await expect(guardedCalls.createModelImage(jwt)).rejects.toMatchObject({
			code: "model_image_upload_not_found",
		});
	});

	it("rejects another company's upload", async () => {
		dbMock.queue([{ companyId: otherCompanyId }]);

		await expect(guardedCalls.createModelImage(jwt)).rejects.toMatchObject({
			code: "model_image_key_mismatch",
			status: 403,
		});
		expect(repo.insertModelImage).not.toHaveBeenCalled();
	});

	it("links the upload with defaults and returns it with a presigned url", async () => {
		dbMock.queue([{ companyId }], [{ id: "img", key: "k" }]);
		const reply = createFakeReply();

		await ModelsService.createModelImage({
			userJwt: jwt,
			subdomain: "fixr",
			modelId: "m",
			data: { uploadId: "u" },
			response: asReply(reply),
		});

		expect(repo.insertModelImage).toHaveBeenCalledWith({
			id: expect.any(String),
			modelId: "m",
			uploadId: "u",
			isPrimary: false,
			variant: null,
			position: 0,
		});
		expect(reply.state.statusCode).toBe(201);
		expect(reply.state.body).toMatchObject({
			data: { id: "img", presignedUrl: "https://signed" },
		});
	});
});

describe("ModelsService.deleteModelImage", () => {
	beforeEach(() => {
		repo.queryModelById.mockResolvedValue(model({ id: "m" }));
	});

	it("returns 404 for an image of another model", async () => {
		repo.queryModelImages.mockResolvedValue([{ id: "other", key: "k" }]);

		await expect(guardedCalls.deleteModelImage(jwt)).rejects.toMatchObject({
			code: "model_image_not_found",
		});
	});

	it("deletes the R2 object and then the record", async () => {
		repo.queryModelImages.mockResolvedValue([{ id: "i", key: "k" }]);

		await guardedCalls.deleteModelImage(jwt);

		expect(repo.deleteR2Object).toHaveBeenCalledWith("k");
		expect(repo.deleteModelImageRecord).toHaveBeenCalledWith("i");
	});

	it("keeps the record when the R2 delete fails (no orphan in the bucket)", async () => {
		repo.queryModelImages.mockResolvedValue([{ id: "i", key: "k" }]);
		repo.deleteR2Object.mockRejectedValue(new Error("R2 down"));

		await expect(guardedCalls.deleteModelImage(jwt)).rejects.toThrow("R2 down");
		expect(repo.deleteModelImageRecord).not.toHaveBeenCalled();
	});
});
