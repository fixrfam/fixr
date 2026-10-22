import { db, eq } from "@fixr/db/connection";
import { companies, employees, users } from "@fixr/db/schema";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeCompany } from "../../factories";
import { createTestApp } from "../../helpers/app";
import { authedInject, createEmployeeSession } from "../../helpers/auth";

// Clerk is a third-party identity provider; only its token check is stubbed.
const verifyToken = vi.hoisted(() => vi.fn());
vi.mock("@clerk/backend", () => ({ verifyToken }));

const app = await createTestApp();

describe("GET /companies", () => {
	it("returns the company of the authenticated employee", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "technician",
		});

		const response = await authedInject(app, token, {
			method: "GET",
			url: "/companies",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().data).toMatchObject({
			id: company.id,
			subdomain: company.subdomain,
		});
	});
});

describe("GET /companies/:subdomain", () => {
	it("returns the employee's own company", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "technician",
		});

		const response = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().data.id).toBe(company.id);
	});

	it("does not expose another existing company", async () => {
		const other = await makeCompany();
		const { token } = await createEmployeeSession(app, { role: "admin" });

		const response = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${other.subdomain}`,
		});

		expect(response.statusCode).toBe(403);
		expect(JSON.stringify(response.json())).not.toContain(other.id);
	});

	it("rejects a malformed subdomain", async () => {
		const { token } = await createEmployeeSession(app, { role: "admin" });

		const response = await authedInject(app, token, {
			method: "GET",
			url: "/companies/Not_Valid",
		});

		expect(response.statusCode).toBe(400);
	});
});

describe("POST /companies (admin panel)", () => {
	const body = {
		name: "Nova Assistência",
		cnpj: "11.222.333/0001-81",
		subdomain: "nova-assistencia",
		owner_cpf: "529.982.247-25",
		owner_email: "owner@nova.test",
		owner_password: "Str0ng!Pass",
	};

	beforeEach(() => {
		verifyToken.mockReset();
	});

	it("creates the company with its admin when the Clerk session is valid", async () => {
		verifyToken.mockResolvedValue({ sub: "user_admin" });

		const response = await app.inject({
			method: "POST",
			url: "/companies",
			headers: { authorization: "Bearer clerk" },
			payload: body,
		});

		expect(response.statusCode).toBe(201);
		const [company] = await db
			.select()
			.from(companies)
			.where(eq(companies.subdomain, "nova-assistencia"));
		expect(company?.cnpj).toBe("11222333000181");
		const [owner] = await db
			.select({ role: employees.role, cpf: employees.cpf })
			.from(employees)
			.innerJoin(users, eq(users.id, employees.userId))
			.where(eq(users.email, "owner@nova.test"));
		expect(owner).toEqual({ role: "admin", cpf: "52998224725" });
	});

	it("rejects a duplicate subdomain with 409 instead of a raw MySQL error", async () => {
		verifyToken.mockResolvedValue({ sub: "user_admin" });
		await makeCompany({ subdomain: "nova-assistencia" });

		const response = await app.inject({
			method: "POST",
			url: "/companies",
			headers: { authorization: "Bearer clerk" },
			payload: body,
		});

		expect(response.statusCode).toBe(409);
		expect(response.json().code).toBe("subdomain_taken");
	});

	it("rejects a request without a Clerk session", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/companies",
			payload: body,
		});

		expect(response.statusCode).toBe(401);
		expect(verifyToken).not.toHaveBeenCalled();
	});

	it("rejects an app (JWT) session: only the admin panel can create companies", async () => {
		verifyToken.mockRejectedValue(new Error("not a Clerk token"));
		const { token } = await createEmployeeSession(app, { role: "admin" });

		const response = await authedInject(app, token, {
			method: "POST",
			url: "/companies",
			payload: body,
		});

		expect(response.statusCode).toBe(401);
	});
});
