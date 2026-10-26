import { db, eq } from "@fixr/db/connection";
import {
	devices,
	serviceOrderImages,
	serviceOrders,
	uploads,
} from "@fixr/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { events } from "../../../src/core/events";
import {
	makeCategory,
	makeCompany,
	makeCustomer,
	makeDevice,
	makeEmployee,
	makeMaker,
	makeServiceOrder,
	makeUpload,
	type TestCompany,
} from "../../factories";
import { createTestApp } from "../../helpers/app";
import { authedInject, createEmployeeSession } from "../../helpers/auth";

const app = await createTestApp();

/** A customer of `companyId` (orders only accept the company's own devices) with a device, plus its maker and category. */
async function catalog(companyId?: string) {
	const owner = companyId ?? (await makeCompany()).id;
	const [customer, maker, category] = await Promise.all([
		makeCustomer({ name: "Maria Cliente", companyId: owner }),
		makeMaker(),
		makeCategory(),
	]);
	const device = await makeDevice({
		companyId: owner,
		customerId: customer.id,
		makerId: maker.id,
		categoryId: category.id,
		modelName: "iPhone 12",
	});
	return { customer, maker, category, device };
}

function orderBody(
	refs: Awaited<ReturnType<typeof catalog>>,
	extra: object = {}
) {
	return {
		deviceId: refs.device.id,
		reportedDefect: "Tela quebrada",
		...extra,
	};
}

const deviceStatus = async (deviceId: string) =>
	(await db.select().from(devices).where(eq(devices.id, deviceId)))[0]?.status;

describe("POST /companies/:subdomain/service-orders", () => {
	it("opens an order for the device's owner and moves the device to the shop", async () => {
		const { token, company, employee } = await createEmployeeSession(app, {
			role: "manager",
		});
		const refs = await catalog(company.id);

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/service-orders`,
			payload: orderBody(refs),
		});

		expect(response.statusCode).toBe(201);
		expect(response.json().data).toMatchObject({
			companyId: company.id,
			employeeId: employee.id,
			customerId: refs.customer.id,
			deviceId: refs.device.id,
			status: "pending",
			photos: [],
		});
		expect(await deviceStatus(refs.device.id)).toBe("in_shop");
	});

	it("ignores a caller-provided status and timestamps", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "manager",
		});
		const refs = await catalog(company.id);

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/service-orders`,
			payload: orderBody(refs, {
				status: "delivered",
				createdAt: "2000-01-01T00:00:00Z",
			}),
		});

		const [stored] = await db
			.select()
			.from(serviceOrders)
			.where(eq(serviceOrders.id, response.json().data.id));
		expect(stored?.status).toBe("pending");
		expect(stored!.createdAt.getFullYear()).toBeGreaterThan(2000);
	});

	it("attaches the company's uploads as photos and marks them completed", async () => {
		const { token, company, employee } = await createEmployeeSession(app, {
			role: "manager",
		});
		const refs = await catalog(company.id);
		const upload = await makeUpload({
			companyId: company.id,
			employeeId: employee.id,
		});

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/service-orders`,
			payload: orderBody(refs, {
				photos: [{ uploadId: upload.id, description: "Frente" }],
			}),
		});

		expect(response.statusCode).toBe(201);
		expect(await db.select().from(serviceOrderImages)).toHaveLength(1);
		const [stored] = await db
			.select()
			.from(uploads)
			.where(eq(uploads.id, upload.id));
		expect(stored?.status).toBe("completed");
	});

	it("rejects an upload from another company", async () => {
		const other = await makeCompany();
		const foreign = await makeUpload({ companyId: other.id });
		const { token, company } = await createEmployeeSession(app, {
			role: "manager",
		});

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/service-orders`,
			payload: orderBody(await catalog(company.id), {
				photos: [{ uploadId: foreign.id }],
			}),
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().code).toBe("upload_not_found");
		expect(await db.select().from(serviceOrders)).toHaveLength(0);
	});

	it("rejects an unknown device", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "manager",
		});

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/service-orders`,
			payload: orderBody(await catalog(company.id), { deviceId: createId() }),
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().code).toBe("service_order_device_not_found");
	});

	it("rejects a deleted device", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "manager",
		});
		const refs = await catalog(company.id);
		await db
			.update(devices)
			.set({ deletedAt: new Date() })
			.where(eq(devices.id, refs.device.id));

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/service-orders`,
			payload: orderBody(refs),
		});

		expect(response.statusCode).toBe(400);
	});

	it("rejects a device of another company", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "manager",
		});
		const foreign = await catalog((await makeCompany()).id);

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/service-orders`,
			payload: orderBody(foreign),
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().code).toBe("service_order_device_not_found");
	});

	it("cannot create orders in another company", async () => {
		const other = await makeCompany();
		const { token } = await createEmployeeSession(app, { role: "manager" });

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${other.subdomain}/service-orders`,
			payload: orderBody(await catalog()),
		});

		expect(response.statusCode).toBe(403);
	});
});

describe("GET /companies/:subdomain/service-orders", () => {
	async function seedOrders(company: TestCompany) {
		const technician = await makeEmployee({ company, role: "technician" });
		const refs = await catalog(company.id);
		const otherCategory = await makeCategory();
		const base = {
			companyId: company.id,
			customerId: refs.customer.id,
			employeeId: technician.id,
			deviceMakerId: refs.maker.id,
			deviceCategoryId: refs.category.id,
		};
		// The catalog's device is an iPhone 12 of `refs.category`.
		await makeServiceOrder({
			...base,
			deviceId: refs.device.id,
			status: "pending",
			createdAt: new Date("2024-01-10"),
		});
		await makeServiceOrder({
			...base,
			deviceModel: "Galaxy S20",
			status: "fixing",
			createdAt: new Date("2024-02-10"),
		});
		await makeServiceOrder({
			...base,
			deviceModel: "Moto G",
			status: "fixing",
			deviceCategoryId: otherCategory.id,
			createdAt: new Date("2024-03-10"),
		});
		return { technician, refs, otherCategory };
	}

	const list = (token: string, subdomain: string, query: string) =>
		authedInject(app, token, {
			method: "GET",
			url: `/companies/${subdomain}/service-orders?page=1&${query}`,
		});

	it("lists newest first with joined names", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "technician",
		});
		await seedOrders(company);

		const response = await list(token, company.subdomain, "");

		expect(response.statusCode).toBe(200);
		const records = response.json().data.records;
		expect(
			records.map((r: { model: { name: string } }) => r.model.name)
		).toEqual(["Moto G", "Galaxy S20", "iPhone 12"]);
		expect(records[0].customer.name).toBe("Maria Cliente");
		expect(records[0].deviceCategory.id).toBeTruthy();
	});

	it("filters by status, category, employee, period and search (combined)", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "technician",
		});
		const { technician, otherCategory } = await seedOrders(company);
		const total = async (query: string) =>
			(await list(token, company.subdomain, query)).json().data.pagination
				.total_records;

		expect(await total("status=fixing")).toBe(2);
		expect(await total(`deviceCategoryId=${otherCategory.id}`)).toBe(1);
		expect(await total(`employeeId=${technician.id}`)).toBe(3);
		expect(await total("dateFrom=2024-02-01&dateTo=2024-02-28")).toBe(1);
		expect(await total("query=Maria")).toBe(3);
		expect(await total("query=Galaxy&status=fixing")).toBe(1);
		expect(await total("status=delivered")).toBe(0);
	});

	it("rejects an invalid status filter", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "technician",
		});

		const response = await list(token, company.subdomain, "status=done");

		expect(response.statusCode).toBe(400);
	});

	it("never returns another company's orders", async () => {
		const other = await makeCompany();
		await seedOrders(other);
		const { token, company } = await createEmployeeSession(app, {
			role: "technician",
		});

		const own = await list(token, company.subdomain, "");
		const foreign = await list(token, other.subdomain, "");

		expect(own.json().data.records).toEqual([]);
		expect(foreign.statusCode).toBe(403);
	});
});

describe("service order detail and status", () => {
	async function setup(
		role: "manager" | "technician" | "warehouse" = "manager"
	) {
		const session = await createEmployeeSession(app, { role });
		const refs = await catalog(session.company.id);
		const serviceOrder = await makeServiceOrder({
			companyId: session.company.id,
			customerId: refs.customer.id,
			employeeId: session.employee.id,
			deviceId: refs.device.id,
		});
		const url = `/companies/${session.company.subdomain}/service-orders/${serviceOrder.id}`;
		return { ...session, refs, serviceOrder, url };
	}

	it("returns the order with its customer, device and model", async () => {
		const { token, url, refs } = await setup("technician");

		const response = await authedInject(app, token, { method: "GET", url });

		expect(response.statusCode).toBe(200);
		expect(response.json().data).toMatchObject({
			customer: { id: refs.customer.id, name: "Maria Cliente" },
			device: { id: refs.device.id },
			model: { name: "iPhone 12" },
			deviceMaker: { id: refs.maker.id },
			deviceCategory: { id: refs.category.id },
			photos: [],
		});
	});

	it("hides another company's order", async () => {
		const { serviceOrder } = await setup();
		const { token, company } = await createEmployeeSession(app, {
			role: "manager",
		});

		const response = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/service-orders/${serviceOrder.id}`,
		});

		expect(response.statusCode).toBe(404);
	});

	it("edits the reported issue and the notes", async () => {
		const { token, url } = await setup();

		const response = await authedInject(app, token, {
			method: "PATCH",
			url,
			payload: { reportedDefect: "Não liga", observations: "Sem carregador" },
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().data).toMatchObject({
			reportedDefect: "Não liga",
			observations: "Sem carregador",
		});
	});

	it.each([
		["fixing", "in_shop"],
		["ready", "ready_for_pickup"],
		["delivered", "with_customer"],
	] as const)("moving to %s leaves the device %s", async (status, expected) => {
		const { token, url, refs } = await setup("technician");

		const response = await authedInject(app, token, {
			method: "PATCH",
			url: `${url}/status`,
			payload: { status },
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().data.status).toBe(status);
		expect(await deviceStatus(refs.device.id)).toBe(expected);
	});

	it("rolls the status back when an effect of the change fails", async () => {
		const { token, url, refs, serviceOrder } = await setup("technician");
		events.on("serviceOrder.statusChanged", "test.fail", () => {
			throw new Error("effect failed");
		});

		try {
			const response = await authedInject(app, token, {
				method: "PATCH",
				url: `${url}/status`,
				payload: { status: "delivered" },
			});

			expect(response.statusCode).toBe(500);
		} finally {
			events.off("serviceOrder.statusChanged", "test.fail");
		}
		const [stored] = await db
			.select()
			.from(serviceOrders)
			.where(eq(serviceOrders.id, serviceOrder.id));
		expect(stored?.status).toBe("pending");
		expect(await deviceStatus(refs.device.id)).toBe("with_customer");
	});

	it("needs the change status permission", async () => {
		const { token, url } = await setup("warehouse");

		const response = await authedInject(app, token, {
			method: "PATCH",
			url: `${url}/status`,
			payload: { status: "ready" },
		});

		expect(response.statusCode).toBe(403);
	});
});
