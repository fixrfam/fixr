import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const { dbMock, repo, pagination } = vi.hoisted(() => ({
	dbMock: {} as ReturnType<
		typeof import("@/test/helpers/query-builder-mock").createDbMock
	>,
	repo: {
		buildListFilter: vi.fn(() => "FILTER"),
		queryEmployeeByUserId: vi.fn(),
		queryClientById: vi.fn(),
		queryDeviceMakerById: vi.fn(),
		queryDeviceCategoryById: vi.fn(),
		createWithPhotos: vi.fn(),
	},
	pagination: { getPaginatedRecords: vi.fn(), getPaginatedCount: vi.fn() },
}));

vi.mock("@fixr/db/connection", async (importOriginal) => {
	const { createDbMock } = await import("@/test/helpers/query-builder-mock");
	Object.assign(dbMock, createDbMock());
	return { ...(await importOriginal<object>()), db: dbMock.db };
});
vi.mock("../repositories", () => ({
	ServiceOrdersRepository: repo,
	serviceOrdersListJoins: ["JOINS"],
	serviceOrdersListSelect: {},
}));
vi.mock("../../../core/lib/pagination", () => pagination);

const { ServiceOrdersService } = await import(".");

const companyId = createId();
const userJwt = {
	id: createId(),
	email: "a@fixr.test",
	displayName: null,
	avatarUrl: null,
	profileType: "employee" as const,
	createdAt: new Date(),
	company: {
		id: companyId,
		name: "Fixr",
		subdomain: "fixr",
		role: "manager" as const,
	},
};
const noCompany = { ...userJwt, company: undefined };

afterEach(() => {
	vi.clearAllMocks();
	dbMock.reset();
});

describe("ServiceOrdersService.getCompanyServiceOrders", () => {
	beforeEach(() => {
		pagination.getPaginatedRecords.mockResolvedValue([]);
		pagination.getPaginatedCount.mockResolvedValue(0);
	});

	const list = (
		params: Record<string, unknown> = {},
		jwt: unknown = userJwt
	) => {
		const reply = createFakeReply();
		return {
			reply,
			promise: ServiceOrdersService.getCompanyServiceOrders({
				userJwt: jwt as never,
				subdomain: "fixr",
				page: 1,
				response: asReply(reply),
				...params,
			}),
		};
	};

	it("rejects a user without company", async () => {
		await expect(list({}, noCompany).promise).rejects.toMatchObject({
			code: "company_not_found",
		});
	});

	it("never lists another company's orders", async () => {
		await expect(list({ subdomain: "other" }).promise).rejects.toMatchObject({
			code: "not_allowed",
			status: 403,
		});
		expect(pagination.getPaginatedRecords).not.toHaveBeenCalled();
	});

	it("scopes the filter to the JWT company and forwards every filter", async () => {
		const dateFrom = new Date("2024-01-01");
		const dateTo = new Date("2024-01-31");

		await list({
			query: "iphone",
			deviceCategoryId: "cat",
			employeeId: "emp",
			status: "fixing",
			dateFrom,
			dateTo,
		}).promise;

		expect(repo.buildListFilter).toHaveBeenCalledWith(companyId, {
			query: "iphone",
			deviceCategoryId: "cat",
			employeeId: "emp",
			status: "fixing",
			dateFrom,
			dateTo,
		});
	});

	it("only joins on the count query when searching (the search spans the client name)", async () => {
		await list().promise;
		expect(pagination.getPaginatedCount).toHaveBeenLastCalledWith(
			expect.objectContaining({ joins: undefined })
		);

		await list({ query: "maria" }).promise;
		expect(pagination.getPaginatedCount).toHaveBeenLastCalledWith(
			expect.objectContaining({ joins: ["JOINS"] })
		);
	});

	it("returns an empty page with total 0 when nothing matches", async () => {
		const { reply, promise } = list({ status: "delivered" });
		await promise;

		expect(reply.state.statusCode).toBe(200);
		expect(reply.state.body).toMatchObject({
			data: { records: [], pagination: { total_records: 0, total_pages: 0 } },
		});
	});

	it("paginates (first, middle and last page)", async () => {
		pagination.getPaginatedCount.mockResolvedValue(21);

		pagination.getPaginatedRecords.mockResolvedValue(new Array(10).fill({}));
		const first = list({ page: 1 });
		await first.promise;
		expect(first.reply.state.body).toMatchObject({
			data: { pagination: { total_pages: 3, next_page: 2, prev_page: null } },
		});

		const middle = list({ page: 2 });
		await middle.promise;
		expect(middle.reply.state.body).toMatchObject({
			data: { pagination: { next_page: 3, prev_page: 1 } },
		});

		pagination.getPaginatedRecords.mockResolvedValue([{}]);
		const last = list({ page: 3 });
		await last.promise;
		expect(last.reply.state.body).toMatchObject({
			data: { pagination: { next_page: null, prev_page: 2 } },
		});
	});

	it("rejects a page past the end", async () => {
		pagination.getPaginatedCount.mockResolvedValue(10);

		await expect(list({ page: 2 }).promise).rejects.toMatchObject({
			code: "page_out_of_bounds",
			status: 416,
		});
	});

	it("uses newest first by default and oldest first on request", async () => {
		await list().promise;
		const defaultOrder = pagination.getPaginatedRecords.mock.calls[0]![0].order;
		await list({ sort: "older" }).promise;
		const olderOrder = pagination.getPaginatedRecords.mock.calls[1]![0].order;
		await list({ sort: "newer" }).promise;
		const newerOrder = pagination.getPaginatedRecords.mock.calls[2]![0].order;

		expect(newerOrder).toEqual(defaultOrder);
		expect(olderOrder).not.toEqual(defaultOrder);
	});
});

describe("ServiceOrdersService.createServiceOrder", () => {
	const data = {
		clientId: createId(),
		deviceBrandId: createId(),
		deviceCategoryId: createId(),
		deviceModel: "iPhone 12",
		reportedDefect: "Tela quebrada",
		photos: [] as { uploadId: string; description?: string | null }[],
	};
	const employee = { id: createId(), companyId };

	beforeEach(() => {
		repo.queryEmployeeByUserId.mockResolvedValue(employee);
		repo.queryClientById.mockResolvedValue({ id: data.clientId });
		repo.queryDeviceMakerById.mockResolvedValue({ id: data.deviceBrandId });
		repo.queryDeviceCategoryById.mockResolvedValue({
			id: data.deviceCategoryId,
		});
		repo.createWithPhotos.mockImplementation(
			async ({ companyId: cid, employeeId }) => ({
				serviceOrder: {
					id: "so1",
					companyId: cid,
					employeeId,
					status: "pending",
				},
				photos: [],
			})
		);
	});

	const create = (
		overrides: Record<string, unknown> = {},
		jwt: unknown = userJwt
	) => {
		const reply = createFakeReply();
		return {
			reply,
			promise: ServiceOrdersService.createServiceOrder({
				userJwt: jwt as never,
				subdomain: "fixr",
				data: { ...data, ...overrides } as never,
				response: asReply(reply),
			}),
		};
	};

	it("creates the order for the caller's company and employee", async () => {
		const { reply, promise } = create();
		await promise;

		expect(repo.createWithPhotos).toHaveBeenCalledWith({
			companyId,
			employeeId: employee.id,
			data,
		});
		expect(reply.state.statusCode).toBe(201);
		expect(reply.state.body).toMatchObject({
			code: "create_service_order_success",
			data: { id: "so1", status: "pending", photos: [] },
		});
	});

	it("rejects a user without company", async () => {
		await expect(create({}, noCompany).promise).rejects.toMatchObject({
			code: "company_not_found",
		});
	});

	it("never creates orders in another company", async () => {
		const reply = createFakeReply();

		await expect(
			ServiceOrdersService.createServiceOrder({
				userJwt,
				subdomain: "other",
				data,
				response: asReply(reply),
			})
		).rejects.toMatchObject({ code: "not_allowed" });
		expect(repo.createWithPhotos).not.toHaveBeenCalled();
	});

	it("rejects when the caller's employee record belongs to another company", async () => {
		repo.queryEmployeeByUserId.mockResolvedValue({
			id: "e",
			companyId: createId(),
		});

		await expect(create().promise).rejects.toMatchObject({
			code: "employee_not_found",
		});
	});

	it.each([
		["client", "queryClientById", "client_not_found"],
		["device maker", "queryDeviceMakerById", "device_brand_not_found"],
		["device category", "queryDeviceCategoryById", "device_category_not_found"],
	] as const)("rejects an unknown %s", async (_label, method, code) => {
		repo[method].mockResolvedValue(null);

		await expect(create().promise).rejects.toMatchObject({ code });
		expect(repo.createWithPhotos).not.toHaveBeenCalled();
	});

	it("rejects a photo upload that does not exist", async () => {
		dbMock.queue([]);

		await expect(
			create({ photos: [{ uploadId: "missing" }] }).promise
		).rejects.toMatchObject({ code: "upload_not_found" });
	});

	it("rejects a photo uploaded by another company", async () => {
		dbMock.queue([{ id: "up", companyId: createId() }]);

		await expect(
			create({ photos: [{ uploadId: "up" }] }).promise
		).rejects.toMatchObject({ code: "upload_not_found" });
		expect(repo.createWithPhotos).not.toHaveBeenCalled();
	});

	it("accepts photos uploaded by the same company", async () => {
		dbMock.queue([{ id: "up", companyId }]);

		await create({ photos: [{ uploadId: "up" }] }).promise;

		expect(repo.createWithPhotos).toHaveBeenCalled();
	});
});
