import { db, eq } from "@fixr/db/connection";
import { serviceOrderImages, serviceOrders, uploads } from "@fixr/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import {
	makeCategory,
	makeClient,
	makeCompany,
	makeEmployee,
	makeMaker,
	makeServiceOrder,
	makeUpload,
	type TestCompany,
} from "../../factories";
import { createTestApp } from "../../helpers/app";
import { authedInject, createEmployeeSession } from "../../helpers/auth";

const app = await createTestApp();

async function catalog() {
	const [client, maker, category] = await Promise.all([
		makeClient({ name: "Maria Cliente" }),
		makeMaker(),
		makeCategory(),
	]);
	return { client, maker, category };
}

function orderBody(
	refs: Awaited<ReturnType<typeof catalog>>,
	extra: object = {}
) {
	return {
		clientId: refs.client.id,
		deviceBrandId: refs.maker.id,
		deviceCategoryId: refs.category.id,
		deviceModel: "iPhone 12",
		reportedDefect: "Tela quebrada",
		...extra,
	};
}

describe("POST /companies/:subdomain/service-orders", () => {
	it("creates an order end to end with real client, maker and category", async () => {
		const { token, company, employee } = await createEmployeeSession(app, {
			role: "manager",
		});
		const refs = await catalog();

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/service-orders`,
			payload: orderBody(refs),
		});

		expect(response.statusCode).toBe(201);
		expect(response.json().data).toMatchObject({
			companyId: company.id,
			employeeId: employee.id,
			clientId: refs.client.id,
			status: "pending",
			photos: [],
		});
	});

	it("ignores a caller-provided status and timestamps", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "manager",
		});
		const refs = await catalog();

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
		const refs = await catalog();
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
			payload: orderBody(await catalog(), {
				photos: [{ uploadId: foreign.id }],
			}),
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().code).toBe("upload_not_found");
		expect(await db.select().from(serviceOrders)).toHaveLength(0);
	});

	it.each([
		"clientId",
		"deviceBrandId",
		"deviceCategoryId",
	])("rejects an unknown %s", async (field) => {
		const { token, company } = await createEmployeeSession(app, {
			role: "manager",
		});

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/service-orders`,
			payload: orderBody(await catalog(), { [field]: createId() }),
		});

		expect(response.statusCode).toBe(404);
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
		const refs = await catalog();
		const otherCategory = await makeCategory();
		const base = {
			companyId: company.id,
			clientId: refs.client.id,
			employeeId: technician.id,
			deviceMakerId: refs.maker.id,
			deviceCategoryId: refs.category.id,
		};
		await makeServiceOrder({
			...base,
			deviceModel: "iPhone 12",
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
		expect(records.map((r: { deviceModel: string }) => r.deviceModel)).toEqual([
			"Moto G",
			"Galaxy S20",
			"iPhone 12",
		]);
		expect(records[0].client.name).toBe("Maria Cliente");
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
