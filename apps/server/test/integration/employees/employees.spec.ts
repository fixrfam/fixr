import { db, eq } from "@fixr/db/connection";
import { employees, users } from "@fixr/db/schema";
import { describe, expect, it } from "vitest";
import { makeCompany, makeEmployee } from "../../factories";
import { createTestApp } from "../../helpers/app";
import { authedInject, createEmployeeSession } from "../../helpers/auth";

const app = await createTestApp();

const newEmployee = (overrides: Record<string, unknown> = {}) => ({
	name: "Novo Técnico",
	cpf: "52998224725",
	role: "technician",
	email: "novo@fixr.test",
	...overrides,
});

describe("GET /companies/:subdomain/employees", () => {
	it("lists the company's employees with pagination", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "manager",
		});
		for (let i = 0; i < 11; i++) {
			await makeEmployee({ company, role: "technician" });
		}

		const first = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/employees?page=1`,
		});
		const second = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/employees?page=2`,
		});

		expect(first.statusCode).toBe(200);
		expect(first.json().data.records).toHaveLength(10);
		expect(first.json().data.pagination).toMatchObject({
			total_records: 12,
			total_pages: 2,
			next_page: 2,
		});
		expect(second.json().data.records).toHaveLength(2);
		expect(second.json().data.records[0].account.email).toEqual(
			expect.any(String)
		);
	});

	it("filters by name", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "admin",
		});
		await makeEmployee({ company, name: "Carlos Silva" });
		await makeEmployee({ company, name: "Ana Souza" });

		const response = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/employees?page=1&query=Carlos`,
		});

		expect(
			response.json().data.records.map((r: { name: string }) => r.name)
		).toEqual(["Carlos Silva"]);
	});

	it("rejects a page past the end with 416", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "admin",
		});

		const response = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/employees?page=5`,
		});

		expect(response.statusCode).toBe(416);
	});

	it("does not list another company's employees", async () => {
		const other = await makeCompany();
		await makeEmployee({ company: other });
		const { token } = await createEmployeeSession(app, { role: "admin" });

		const response = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${other.subdomain}/employees?page=1`,
		});

		expect(response.statusCode).toBe(403);
	});
});

describe("POST /companies/:subdomain/employees", () => {
	it("creates the employee and account in the requester's company", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "admin",
		});

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/employees`,
			payload: newEmployee(),
		});

		expect(response.statusCode).toBe(201);
		const [created] = await db
			.select({ companyId: employees.companyId, role: employees.role })
			.from(employees)
			.innerJoin(users, eq(users.id, employees.userId))
			.where(eq(users.email, "novo@fixr.test"));
		expect(created).toEqual({ companyId: company.id, role: "technician" });
	});

	it("does not let a manager create an admin", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "manager",
		});

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/employees`,
			payload: newEmployee({ role: "admin" }),
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().code).toBe("violates_role_hierarchy");
	});

	it("rejects a role outside employeeRoles", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "admin",
		});

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/employees`,
			payload: newEmployee({ role: "owner" }),
		});

		expect(response.statusCode).toBe(400);
	});

	it.each([
		["email", { cpf: "11144477735" }, "email_already_used"],
		["CPF", { email: "other@fixr.test" }, "cpf_conflict"],
	])("rejects a duplicate %s with 409", async (_label, overrides, code) => {
		const { token, company } = await createEmployeeSession(app, {
			role: "admin",
		});
		const create = (payload: Record<string, unknown>) =>
			authedInject(app, token, {
				method: "POST",
				url: `/companies/${company.subdomain}/employees`,
				payload,
			});

		await create(newEmployee());
		const response = await create(newEmployee(overrides));

		expect(response.statusCode).toBe(409);
		expect(response.json().code).toBe(code);
	});

	it("cannot add employees to another company", async () => {
		const other = await makeCompany();
		const { token } = await createEmployeeSession(app, { role: "admin" });

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${other.subdomain}/employees`,
			payload: newEmployee(),
		});

		expect(response.statusCode).toBe(403);
		expect(
			await db.select().from(users).where(eq(users.email, "novo@fixr.test"))
		).toHaveLength(0);
	});
});
