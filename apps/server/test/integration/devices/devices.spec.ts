import { describe, expect, it } from "vitest";
import {
	makeCategory,
	makeCompany,
	makeCustomer,
	makeDevice,
	makeMaker,
	makeModel,
	makeServiceOrder,
} from "../../factories";
import { createTestApp } from "../../helpers/app";
import { authedInject, createEmployeeSession } from "../../helpers/auth";

const app = await createTestApp();

/** A session with a customer and a shared catalog model. */
async function setup(role: "manager" | "technician" = "manager") {
	const session = await createEmployeeSession(app, { role });
	const [customer, maker, category] = await Promise.all([
		makeCustomer({ companyId: session.company.id, name: "Maria Cliente" }),
		makeMaker({ name: "Apple" }),
		makeCategory(),
	]);
	const model = await makeModel({
		makerId: maker.id,
		companyId: null,
		categoryId: category.id,
		name: "iPhone 13",
	});
	const url = `/companies/${session.company.subdomain}/devices`;
	return { ...session, customer, maker, category, model, url };
}

describe("POST /companies/:subdomain/devices", () => {
	it("registers a device for a customer with a catalog model", async () => {
		const { token, url, customer, model, maker } = await setup();

		const response = await authedInject(app, token, {
			method: "POST",
			url,
			payload: {
				clientId: customer.id,
				modelId: model.id,
				imei: "356938035643809",
				serialNumber: "",
			},
		});

		expect(response.statusCode).toBe(201);
		expect(response.json().data).toMatchObject({
			clientId: customer.id,
			imei: "356938035643809",
			serialNumber: null,
			status: "with_customer",
			client: { name: "Maria Cliente" },
			model: { name: "iPhone 13" },
			maker: { id: maker.id },
		});
	});

	it("accepts the company's own models but not another company's", async () => {
		const { token, url, customer, maker, company } = await setup();
		const own = await makeModel({ makerId: maker.id, companyId: company.id });
		const foreign = await makeModel({
			makerId: maker.id,
			companyId: (await makeCompany()).id,
		});

		const ok = await authedInject(app, token, {
			method: "POST",
			url,
			payload: { clientId: customer.id, modelId: own.id },
		});
		const refused = await authedInject(app, token, {
			method: "POST",
			url,
			payload: { clientId: customer.id, modelId: foreign.id },
		});

		expect(ok.statusCode).toBe(201);
		expect(refused.statusCode).toBe(400);
		expect(refused.json().code).toBe("device_model_not_found");
	});

	it("rejects a customer of another company", async () => {
		const { token, url, model } = await setup();
		const foreign = await makeCustomer({ companyId: (await makeCompany()).id });

		const response = await authedInject(app, token, {
			method: "POST",
			url,
			payload: { clientId: foreign.id, modelId: model.id },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().code).toBe("device_client_not_found");
	});

	it("is not allowed for a technician", async () => {
		const { token, url, customer, model } = await setup("technician");

		const response = await authedInject(app, token, {
			method: "POST",
			url,
			payload: { clientId: customer.id, modelId: model.id },
		});

		expect(response.statusCode).toBe(403);
	});
});

describe("GET /companies/:subdomain/devices", () => {
	it("lists, searches and filters the company's active devices", async () => {
		const { token, url, company, customer, model } = await setup("technician");
		const other = await makeCustomer({ companyId: company.id, name: "João" });
		await makeDevice({
			companyId: company.id,
			clientId: customer.id,
			modelId: model.id,
			status: "in_shop",
		});
		await makeDevice({
			companyId: company.id,
			clientId: other.id,
			modelName: "Galaxy S21",
		});
		await makeDevice({
			companyId: company.id,
			clientId: other.id,
			modelId: model.id,
			deletedAt: new Date(),
		});
		const foreignCompany = await makeCompany();
		await makeDevice({
			companyId: foreignCompany.id,
			clientId: (await makeCustomer({ companyId: foreignCompany.id })).id,
			modelId: model.id,
		});
		const total = async (query = "") =>
			(
				await authedInject(app, token, {
					method: "GET",
					url: `${url}?page=1&${query}`,
				})
			).json().data.pagination.total_records;

		expect(await total()).toBe(2);
		expect(await total("status=in_shop")).toBe(1);
		expect(await total(`clientId=${other.id}`)).toBe(1);
		expect(await total("query=iPhone")).toBe(1);
		expect(await total("query=Apple")).toBe(1);
		expect(await total("query=Maria")).toBe(1);
	});
});

describe("device detail, update and delete", () => {
	async function withDevice() {
		const ctx = await setup();
		const device = await makeDevice({
			companyId: ctx.company.id,
			clientId: ctx.customer.id,
			modelId: ctx.model.id,
		});
		await makeServiceOrder({
			companyId: ctx.company.id,
			clientId: ctx.customer.id,
			employeeId: ctx.employee.id,
			deviceId: device.id,
		});
		return { ...ctx, device, deviceUrl: `${ctx.url}/${device.id}` };
	}

	it("returns the device with its service orders", async () => {
		const { token, deviceUrl } = await withDevice();

		const response = await authedInject(app, token, {
			method: "GET",
			url: deviceUrl,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().data.serviceOrders).toHaveLength(1);
	});

	it("updates the status and identifiers", async () => {
		const { token, deviceUrl } = await withDevice();

		const response = await authedInject(app, token, {
			method: "PATCH",
			url: deviceUrl,
			payload: { status: "in_shop", serialNumber: "C02XYZ" },
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().data).toMatchObject({
			status: "in_shop",
			serialNumber: "C02XYZ",
		});
	});

	it("soft deletes, keeping its service orders", async () => {
		const { token, deviceUrl } = await withDevice();

		const deleted = await authedInject(app, token, {
			method: "DELETE",
			url: deviceUrl,
		});
		const after = await authedInject(app, token, {
			method: "GET",
			url: deviceUrl,
		});

		expect(deleted.statusCode).toBe(200);
		expect(after.statusCode).toBe(404);
	});

	it("hides another company's device", async () => {
		const { device } = await withDevice();
		const { token, company } = await createEmployeeSession(app, {
			role: "manager",
		});

		const response = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/devices/${device.id}`,
		});

		expect(response.statusCode).toBe(404);
	});
});
