import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const { repo, pagination } = vi.hoisted(() => ({
	repo: {
		buildListFilter: vi.fn(() => "FILTER"),
		buildOrder: vi.fn(() => ["ORDER"]),
		queryDeviceOfCompany: vi.fn(),
		queryCustomerOfCompany: vi.fn(),
		queryModelForCompany: vi.fn(),
		queryRecentServiceOrders: vi.fn(),
		insertDevice: vi.fn(),
		updateDevice: vi.fn(),
	},
	pagination: { getPaginatedRecords: vi.fn(), getPaginatedCount: vi.fn() },
}));

vi.mock("../repositories", () => ({
	DevicesRepository: repo,
	deviceJoins: ["JOINS"],
	deviceSelect: {},
}));
vi.mock("../../../core/lib/pagination", async (importOriginal) => ({
	...(await importOriginal<object>()),
	...pagination,
}));

const { DevicesService } = await import(".");

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
const device = { id: createId(), companyId, status: "with_customer" };
const body = { customerId: createId(), modelId: createId() };

beforeEach(() => {
	repo.queryDeviceOfCompany.mockResolvedValue(device);
	repo.queryCustomerOfCompany.mockResolvedValue({ id: body.customerId });
	repo.queryModelForCompany.mockResolvedValue({ id: body.modelId });
	repo.insertDevice.mockResolvedValue(device.id);
});

afterEach(() => {
	vi.clearAllMocks();
});

function call<
	K extends
		| "listDevices"
		| "getDevice"
		| "createDevice"
		| "patchDevice"
		| "deleteDevice",
>(method: K, params: Record<string, unknown> = {}, subdomain = "fixr") {
	const reply = createFakeReply();
	return {
		reply,
		promise: DevicesService[method]({
			userJwt,
			subdomain,
			deviceId: device.id,
			page: 1,
			response: asReply(reply),
			...params,
		} as never),
	};
}

describe("DevicesService.listDevices", () => {
	it("lists one page with the joins on both queries", async () => {
		pagination.getPaginatedRecords.mockResolvedValue([device]);
		pagination.getPaginatedCount.mockResolvedValue(1);

		const { reply, promise } = call("listDevices", { status: "in_shop" });
		await promise;

		expect(repo.buildListFilter).toHaveBeenCalledWith(companyId, {
			query: undefined,
			customerId: undefined,
			status: "in_shop",
		});
		expect(pagination.getPaginatedCount).toHaveBeenCalledWith(
			expect.objectContaining({ joins: ["JOINS"] })
		);
		expect(reply.state.body).toMatchObject({
			data: { records: [device], pagination: { total_records: 1 } },
		});
	});

	it("refuses a page past the end", async () => {
		pagination.getPaginatedRecords.mockResolvedValue([]);
		pagination.getPaginatedCount.mockResolvedValue(3);

		await expect(
			call("listDevices", { page: 9 }).promise
		).rejects.toMatchObject({ code: "page_out_of_bounds" });
	});

	it("refuses another company's subdomain", async () => {
		await expect(
			call("listDevices", {}, "other").promise
		).rejects.toMatchObject({ code: "not_allowed" });
	});
});

describe("DevicesService.getDevice", () => {
	it("returns the device with its service orders", async () => {
		repo.queryRecentServiceOrders.mockResolvedValue([{ id: "so" }]);

		const { reply, promise } = call("getDevice");
		await promise;

		expect(reply.state.body).toMatchObject({
			data: { id: device.id, serviceOrders: [{ id: "so" }] },
		});
	});

	it("reports a missing device as not found", async () => {
		repo.queryDeviceOfCompany.mockResolvedValue(null);

		await expect(call("getDevice").promise).rejects.toMatchObject({
			code: "device_not_found",
		});
	});
});

describe("DevicesService.createDevice", () => {
	it("stores blank texts as null in the caller's company", async () => {
		const { reply, promise } = call("createDevice", {
			data: { ...body, imei: "", notes: "Riscado" },
		});
		await promise;

		expect(repo.insertDevice).toHaveBeenCalledWith({
			...body,
			imei: null,
			notes: "Riscado",
			companyId,
		});
		expect(reply.state.statusCode).toBe(201);
	});

	it("refuses a customer the company doesn't have", async () => {
		repo.queryCustomerOfCompany.mockResolvedValue(null);

		await expect(
			call("createDevice", { data: body }).promise
		).rejects.toMatchObject({ code: "device_client_not_found" });
		expect(repo.insertDevice).not.toHaveBeenCalled();
	});

	it("refuses a model the company can't use", async () => {
		repo.queryModelForCompany.mockResolvedValue(null);

		await expect(
			call("createDevice", { data: body }).promise
		).rejects.toMatchObject({ code: "device_model_not_found" });
	});
});

describe("DevicesService.patchDevice and deleteDevice", () => {
	it("checks a new model before updating", async () => {
		await call("patchDevice", { data: { modelId: body.modelId } }).promise;

		expect(repo.queryModelForCompany).toHaveBeenCalledWith(
			body.modelId,
			companyId
		);
		expect(repo.updateDevice).toHaveBeenCalledWith(device.id, {
			modelId: body.modelId,
		});
	});

	it("skips the update when nothing changed", async () => {
		await call("patchDevice", { data: {} }).promise;

		expect(repo.updateDevice).not.toHaveBeenCalled();
	});

	it("soft deletes", async () => {
		await call("deleteDevice").promise;

		expect(repo.updateDevice).toHaveBeenCalledWith(device.id, {
			deletedAt: expect.any(Date),
		});
	});
});
