import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const { dbMock, repo, pagination, emit } = vi.hoisted(() => ({
	emit: vi.fn(),
	dbMock: {} as ReturnType<
		typeof import("@/test/helpers/query-builder-mock").createDbMock
	>,
	repo: {
		buildListFilter: vi.fn(() => "FILTER"),
		queryEmployeeByUserId: vi.fn(),
		queryDeviceOfCompany: vi.fn(),
		createWithPhotos: vi.fn(),
		queryServiceOrderOfCompany: vi.fn(),
		queryServiceOrderDetail: vi.fn(),
		updateServiceOrder: vi.fn(),
		updateStatus: vi.fn(),
		queryItems: vi.fn(),
		queryItem: vi.fn(),
		queryCatalogItem: vi.fn(),
		insertItem: vi.fn(),
		updateItem: vi.fn(),
		deleteItem: vi.fn(),
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
vi.mock("../../../core/lib/transaction", () => ({
	inTransaction: (work: (tx: unknown) => unknown) => work("TX"),
}));
vi.mock("../../../core/events", () => ({ events: { emit } }));

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

	it("joins on the count query too (search and the category filter read joined tables)", async () => {
		await list().promise;
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
	const clientId = createId();
	const data = {
		deviceId: createId(),
		reportedDefect: "Tela quebrada",
		photos: [] as { uploadId: string; description?: string | null }[],
	};
	const employee = { id: createId(), companyId };

	beforeEach(() => {
		repo.queryEmployeeByUserId.mockResolvedValue(employee);
		repo.queryDeviceOfCompany.mockResolvedValue({
			id: data.deviceId,
			clientId,
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

	it("creates the order for the caller's company, employee and the device's owner", async () => {
		const { reply, promise } = create();
		await promise;

		expect(repo.queryDeviceOfCompany).toHaveBeenCalledWith(
			data.deviceId,
			companyId
		);
		expect(repo.createWithPhotos).toHaveBeenCalledWith("TX", {
			companyId,
			employeeId: employee.id,
			clientId,
			data,
		});
		expect(emit).toHaveBeenCalledWith("TX", "serviceOrder.opened", {
			serviceOrderId: "so1",
			companyId,
			deviceId: data.deviceId,
			employeeId: employee.id,
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

	it("rejects a device that is not an active device of the company", async () => {
		repo.queryDeviceOfCompany.mockResolvedValue(null);

		await expect(create().promise).rejects.toMatchObject({
			code: "service_order_device_not_found",
		});
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

describe("ServiceOrdersService items", () => {
	const serviceOrderId = createId();
	const item = {
		id: createId(),
		serviceOrderId,
		type: "part" as const,
		unitPrice: 10.1,
		quantity: 3,
	};
	const base = { userJwt, subdomain: "fixr", serviceOrderId };

	beforeEach(() => {
		repo.queryServiceOrderOfCompany.mockResolvedValue({ id: serviceOrderId });
		repo.queryItems.mockResolvedValue([item]);
	});

	it("lists items with line totals and order totals", async () => {
		const reply = createFakeReply();

		await ServiceOrdersService.listItems({ ...base, response: asReply(reply) });

		expect(repo.queryServiceOrderOfCompany).toHaveBeenCalledWith(
			serviceOrderId,
			companyId
		);
		expect(reply.state.body).toMatchObject({
			data: {
				items: [{ id: item.id, total: 30.3 }],
				totals: { parts: 30.3, services: 0, total: 30.3 },
			},
		});
	});

	it("rejects a service order of another company", async () => {
		repo.queryServiceOrderOfCompany.mockResolvedValue(null);

		await expect(
			ServiceOrdersService.listItems({
				...base,
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "service_order_not_found" });
	});

	it("snapshots the catalog name and price when adding", async () => {
		const partId = createId();
		repo.queryCatalogItem.mockResolvedValue({
			id: partId,
			name: "Tela",
			price: 890,
		});

		await ServiceOrdersService.addItem({
			...base,
			data: { type: "part", itemId: partId, quantity: 2 },
			response: asReply(createFakeReply()),
		});

		expect(repo.queryCatalogItem).toHaveBeenCalledWith(
			"part",
			partId,
			companyId
		);
		expect(repo.insertItem).toHaveBeenCalledWith({
			serviceOrderId,
			type: "part",
			partId,
			serviceId: null,
			name: "Tela",
			quantity: 2,
			unitPrice: 890,
		});
	});

	it("uses the price sent instead of the catalog one", async () => {
		const serviceId = createId();
		repo.queryCatalogItem.mockResolvedValue({
			id: serviceId,
			name: "Troca",
			price: 150,
		});

		await ServiceOrdersService.addItem({
			...base,
			data: { type: "service", itemId: serviceId, quantity: 1, unitPrice: 99 },
			response: asReply(createFakeReply()),
		});

		expect(repo.insertItem).toHaveBeenCalledWith(
			expect.objectContaining({ serviceId, partId: null, unitPrice: 99 })
		);
	});

	it("rejects a catalog item outside the company", async () => {
		repo.queryCatalogItem.mockResolvedValue(null);

		await expect(
			ServiceOrdersService.addItem({
				...base,
				data: { type: "part", itemId: createId(), quantity: 1 },
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "service_order_catalog_item_not_found" });
		expect(repo.insertItem).not.toHaveBeenCalled();
	});

	it.each([
		["patchItem", { data: { quantity: 2 } }],
		["deleteItem", {}],
	] as const)("%s rejects an item of another order", async (method, extra) => {
		repo.queryItem.mockResolvedValue(null);

		await expect(
			ServiceOrdersService[method]({
				...base,
				itemId: createId(),
				...(extra as { data: { quantity: number } }),
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "service_order_item_not_found" });
	});
});

describe("ServiceOrdersService detail, edit and status", () => {
	const serviceOrderId = createId();
	const deviceId = createId();
	const detail = { id: serviceOrderId, status: "ready", photos: [] };

	beforeEach(() => {
		repo.queryServiceOrderOfCompany.mockResolvedValue({
			id: serviceOrderId,
			deviceId,
			status: "fixing",
		});
		repo.queryServiceOrderDetail.mockResolvedValue(detail);
	});

	const call = <
		K extends "getServiceOrder" | "patchServiceOrder" | "changeStatus",
	>(
		method: K,
		data?: object
	) => {
		const reply = createFakeReply();
		return {
			reply,
			promise: ServiceOrdersService[method]({
				userJwt,
				subdomain: "fixr",
				serviceOrderId,
				data: data as never,
				response: asReply(reply),
			}),
		};
	};

	it("returns the detail of an order of the company", async () => {
		const { reply, promise } = call("getServiceOrder");
		await promise;

		expect(repo.queryServiceOrderDetail).toHaveBeenCalledWith(
			serviceOrderId,
			companyId
		);
		expect(reply.state.body).toMatchObject({ data: detail });
	});

	it("reports a missing order as not found", async () => {
		repo.queryServiceOrderDetail.mockResolvedValue(null);

		await expect(call("getServiceOrder").promise).rejects.toMatchObject({
			code: "service_order_not_found",
		});
	});

	it("skips the update when nothing changed", async () => {
		await call("patchServiceOrder", {}).promise;

		expect(repo.updateServiceOrder).not.toHaveBeenCalled();
	});

	it("updates the issue and notes", async () => {
		await call("patchServiceOrder", { observations: "Sem chip" }).promise;

		expect(repo.updateServiceOrder).toHaveBeenCalledWith(serviceOrderId, {
			observations: "Sem chip",
		});
	});

	it("moves the order and announces it in the same transaction", async () => {
		const { reply, promise } = call("changeStatus", { status: "ready" });
		await promise;

		expect(repo.updateStatus).toHaveBeenCalledWith(
			"TX",
			serviceOrderId,
			"ready"
		);
		expect(emit).toHaveBeenCalledWith("TX", "serviceOrder.statusChanged", {
			serviceOrderId,
			companyId,
			deviceId,
			from: "fixing",
			to: "ready",
		});
		expect(reply.state.body).toMatchObject({
			code: "change_service_order_status_success",
		});
	});

	it("changes nothing when the status is the current one", async () => {
		await call("changeStatus", { status: "fixing" }).promise;

		expect(repo.updateStatus).not.toHaveBeenCalled();
		expect(emit).not.toHaveBeenCalled();
	});

	it("never changes another company's order", async () => {
		repo.queryServiceOrderOfCompany.mockResolvedValue(null);

		await expect(
			call("changeStatus", { status: "ready" }).promise
		).rejects.toMatchObject({ code: "service_order_not_found" });
		expect(repo.updateStatus).not.toHaveBeenCalled();
	});
});
