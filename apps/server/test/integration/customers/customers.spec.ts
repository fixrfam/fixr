import { db, eq } from "@fixr/db/connection";
import { customers } from "@fixr/db/schema";
import { describe, expect, it } from "vitest";
import {
	makeCategory,
	makeCompany,
	makeCustomer,
	makeMaker,
	makeServiceOrder,
} from "../../factories";
import { createTestApp } from "../../helpers/app";
import { authedInject, createEmployeeSession } from "../../helpers/auth";

const app = await createTestApp();

async function managerSession() {
	return await createEmployeeSession(app, { role: "manager" });
}

const customerBody = {
	name: "Maria Oliveira",
	email: "maria@cliente.com",
	cpf: "529.982.247-25",
	phone: "(11) 99876-5432",
	address: "Avenida Cliente, 456",
	state: "sp",
	city: "São Paulo",
};

describe("POST /companies/:subdomain/customers", () => {
	it("creates a customer with digits-only documents and phones", async () => {
		const { token, company } = await managerSession();

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/customers`,
			payload: customerBody,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json().data).toMatchObject({
			companyId: company.id,
			cpf: "52998224725",
			phone: "11998765432",
			state: "SP",
			userId: null,
		});
	});

	it("refuses a CPF already registered in the company", async () => {
		const { token, company } = await managerSession();
		await makeCustomer({ companyId: company.id, cpf: "52998224725" });

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/customers`,
			payload: customerBody,
		});

		expect(response.statusCode).toBe(409);
		expect(response.json().code).toBe("customer_cpf_conflict");
	});

	it("allows the same CPF in another company", async () => {
		const { token, company } = await managerSession();
		const other = await makeCompany();
		await makeCustomer({ companyId: other.id, cpf: "52998224725" });

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/customers`,
			payload: customerBody,
		});

		expect(response.statusCode).toBe(201);
	});

	it("restores a deleted customer with the same CPF", async () => {
		const { token, company } = await managerSession();
		const deleted = await makeCustomer({
			companyId: company.id,
			cpf: "52998224725",
			deletedAt: new Date(),
		});

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/customers`,
			payload: customerBody,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json().data).toMatchObject({
			id: deleted.id,
			name: "Maria Oliveira",
			deletedAt: null,
		});
	});

	it("rejects a phone with the wrong number of digits", async () => {
		const { token, company } = await managerSession();

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/customers`,
			payload: { ...customerBody, phone: "1234" },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().code).toBe("customer_phone_invalid");
	});
});

describe("GET /companies/:subdomain/customers", () => {
	it("lists only active customers of the company, with search", async () => {
		const { token, company } = await managerSession();
		const other = await makeCompany();
		await makeCustomer({ companyId: company.id, name: "Ana Paula" });
		await makeCustomer({ companyId: company.id, name: "Bruno Dias" });
		await makeCustomer({
			companyId: company.id,
			name: "Ana Removida",
			deletedAt: new Date(),
		});
		await makeCustomer({ companyId: other.id, name: "Ana de Fora" });

		const all = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/customers?page=1&sort=name`,
		});
		const search = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/customers?page=1&query=Ana`,
		});

		expect(
			all.json().data.records.map((c: { name: string }) => c.name)
		).toEqual(["Ana Paula", "Bruno Dias"]);
		expect(search.json().data.pagination.total_records).toBe(1);
	});
});

describe("GET /companies/:subdomain/customers/:customerId", () => {
	it("returns the customer with their service orders in the company", async () => {
		const { token, company, employee } = await managerSession();
		const customer = await makeCustomer({ companyId: company.id });
		const [maker, category] = await Promise.all([makeMaker(), makeCategory()]);
		await makeServiceOrder({
			companyId: company.id,
			customerId: customer.id,
			employeeId: employee.id,
			deviceMakerId: maker.id,
			deviceCategoryId: category.id,
			deviceModel: "iPhone 12",
		});

		const response = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/customers/${customer.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().data).toMatchObject({
			id: customer.id,
			serviceOrders: [{ deviceModel: "iPhone 12", status: "pending" }],
		});
	});

	it("hides another company's customer", async () => {
		const { token, company } = await managerSession();
		const other = await makeCompany();
		const foreign = await makeCustomer({ companyId: other.id });

		const response = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/customers/${foreign.id}`,
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().code).toBe("customer_not_found");
	});
});

describe("PATCH and DELETE /companies/:subdomain/customers/:customerId", () => {
	it("updates the customer", async () => {
		const { token, company } = await managerSession();
		const customer = await makeCustomer({ companyId: company.id });

		const response = await authedInject(app, token, {
			method: "PATCH",
			url: `/companies/${company.subdomain}/customers/${customer.id}`,
			payload: { city: "Campinas", alternativePhone: "(19) 3333-4444" },
		});

		expect(response.json().data).toMatchObject({
			city: "Campinas",
			alternativePhone: "1933334444",
		});
	});

	it("refuses taking another customer's CPF", async () => {
		const { token, company } = await managerSession();
		const first = await makeCustomer({ companyId: company.id });
		const second = await makeCustomer({ companyId: company.id });

		const response = await authedInject(app, token, {
			method: "PATCH",
			url: `/companies/${company.subdomain}/customers/${second.id}`,
			payload: { cpf: first.cpf },
		});

		expect(response.statusCode).toBe(409);
	});

	it("soft deletes: the row stays but the API no longer finds it", async () => {
		const { company } = await managerSession();
		const { token } = await createEmployeeSession(app, {
			role: "admin",
			company,
		});
		const customer = await makeCustomer({ companyId: company.id });
		const url = `/companies/${company.subdomain}/customers/${customer.id}`;

		const deleted = await authedInject(app, token, { method: "DELETE", url });
		const after = await authedInject(app, token, { method: "GET", url });
		const [row] = await db
			.select()
			.from(customers)
			.where(eq(customers.id, customer.id));

		expect(deleted.statusCode).toBe(200);
		expect(after.statusCode).toBe(404);
		expect(row?.deletedAt).not.toBeNull();
	});
});
