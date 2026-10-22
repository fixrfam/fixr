import { db, eq } from "@fixr/db/connection";
import { apiKeys, employees } from "@fixr/db/schema";
import { permissions } from "@fixr/permissions";
import { describe, expect, it } from "vitest";
import { redis } from "@/src/config/redis";
import { makeCompany, makeEmployee, type TestCompany } from "../../factories";
import { createTestApp } from "../../helpers/app";
import { authedInject, createEmployeeSession } from "../../helpers/auth";

const app = await createTestApp();

async function createKey(
	token: string,
	company: TestCompany,
	body: Record<string, unknown> = {}
) {
	const response = await authedInject(app, token, {
		method: "POST",
		url: `/companies/${company.subdomain}/api-keys`,
		payload: { name: "ERP", ...body },
	});
	return response;
}

async function managerWithKey(body: Record<string, unknown> = {}) {
	const session = await createEmployeeSession(app, { role: "manager" });
	const created = await createKey(session.token, session.company, body);
	if (created.statusCode !== 201) {
		throw new Error(`Creating the API key failed: ${created.body}`);
	}
	return {
		...session,
		key: created.json().data as { id: string; secret: string; prefix: string },
	};
}

const withKey = (
	secret: string,
	method: "GET" | "POST",
	url: string,
	payload?: object
) => app.inject({ method, url, payload, headers: { "x-api-key": secret } });

describe("managing keys (session only)", () => {
	it("creates a key, stores only its hash and lists it without secrets", async () => {
		const { token, company, key } = await managerWithKey({
			scopes: [permissions.devices.read],
		});

		const [row] = await db.select().from(apiKeys).where(eq(apiKeys.id, key.id));
		expect(row?.prefix).toBe(key.prefix);
		expect(row?.keyHash).not.toContain(key.secret.slice(-43));

		const list = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/api-keys?page=1`,
		});
		expect(list.statusCode).toBe(200);
		const [listed] = list.json().data.records;
		expect(listed).toMatchObject({
			id: key.id,
			scopes: [permissions.devices.read],
		});
		expect(listed).not.toHaveProperty("keyHash");
		expect(listed).not.toHaveProperty("secret");
	});

	it("only lists the caller's own keys", async () => {
		const company = await makeCompany();
		const a = await createEmployeeSession(app, { role: "manager", company });
		const b = await createEmployeeSession(app, { role: "manager", company });
		await createKey(a.token, company, { name: "Key A" });

		const list = await authedInject(app, b.token, {
			method: "GET",
			url: `/companies/${company.subdomain}/api-keys?page=1`,
		});

		expect(list.json().data.records).toEqual([]);
	});

	it("refuses scopes beyond the creator's role", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "technician",
		});

		const response = await createKey(token, company, {
			scopes: [permissions.employees.create],
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().code).toBe("api_key_invalid_scopes");
	});

	it("rejects a duplicate active name and an expiration in the past", async () => {
		const { token, company } = await managerWithKey();

		expect((await createKey(token, company)).statusCode).toBe(409);
		expect(
			(
				await createKey(token, company, {
					name: "Old",
					expiresAt: "2020-01-01T00:00:00Z",
				})
			).statusCode
		).toBe(400);
	});

	it("cannot revoke another employee's key (404) but revokes its own", async () => {
		const company = await makeCompany();
		const owner = await createEmployeeSession(app, {
			role: "manager",
			company,
		});
		const other = await createEmployeeSession(app, { role: "admin", company });
		const { id } = (await createKey(owner.token, company)).json().data;
		const revoke = (token: string) =>
			authedInject(app, token, {
				method: "DELETE",
				url: `/companies/${company.subdomain}/api-keys/${id}`,
			});

		expect((await revoke(other.token)).statusCode).toBe(404);
		expect((await revoke(owner.token)).statusCode).toBe(200);
		expect((await revoke(owner.token)).statusCode).toBe(409);
	});

	it("a key cannot mint more keys or reach account routes", async () => {
		const { company, key } = await managerWithKey();

		const mint = await withKey(
			key.secret,
			"POST",
			`/companies/${company.subdomain}/api-keys`,
			{
				name: "Escalated",
			}
		);
		const account = await withKey(key.secret, "GET", "/account");

		expect(mint.statusCode).toBe(401);
		expect(account.statusCode).toBe(401);
	});
});

describe("authenticating with a key", () => {
	it.each([
		"x-api-key",
		"authorization",
	])("works on domain routes via %s", async (header) => {
		const { company, key } = await managerWithKey();

		const response = await app.inject({
			method: "GET",
			url: `/companies/${company.subdomain}/employees?page=1`,
			headers:
				header === "x-api-key"
					? { "x-api-key": key.secret }
					: { authorization: `Bearer ${key.secret}` },
		});

		expect(response.statusCode).toBe(200);
	});

	it("records last use", async () => {
		const { company, key } = await managerWithKey();

		await withKey(
			key.secret,
			"GET",
			`/companies/${company.subdomain}/employees?page=1`
		);

		const [row] = await db.select().from(apiKeys).where(eq(apiKeys.id, key.id));
		expect(row?.lastUsedAt).toBeInstanceOf(Date);
	});

	it("scopes narrow what the key can do", async () => {
		const { company, key } = await managerWithKey({
			scopes: [permissions.devices.read],
		});

		const employeesList = await withKey(
			key.secret,
			"GET",
			`/companies/${company.subdomain}/employees?page=1`
		);
		const models = await withKey(
			key.secret,
			"GET",
			`/companies/${company.subdomain}/models?page=1`
		);

		expect(employeesList.statusCode).toBe(403);
		expect(models.statusCode).toBe(200);
	});

	it("never reaches another company", async () => {
		const other = await makeCompany();
		await makeEmployee({ company: other });
		const { key } = await managerWithKey();

		const response = await withKey(
			key.secret,
			"GET",
			`/companies/${other.subdomain}/employees?page=1`
		);

		expect(response.statusCode).toBe(403);
	});

	it("stops working immediately after revocation, even when the lookup was cached", async () => {
		const { token, company, key } = await managerWithKey();
		const url = `/companies/${company.subdomain}/employees?page=1`;
		expect((await withKey(key.secret, "GET", url)).statusCode).toBe(200);
		expect(await redis.keys("api-keys:prefix:*")).toHaveLength(1);

		await authedInject(app, token, {
			method: "DELETE",
			url: `/companies/${company.subdomain}/api-keys/${key.id}`,
		});
		const response = await withKey(key.secret, "GET", url);

		expect(response.statusCode).toBe(401);
		expect(response.json().code).toBe("api_key_revoked");
	});

	it("rejects an expired key", async () => {
		const { company, key } = await managerWithKey();
		await db
			.update(apiKeys)
			.set({ expiresAt: new Date(Date.now() - 1000) })
			.where(eq(apiKeys.id, key.id));

		const response = await withKey(
			key.secret,
			"GET",
			`/companies/${company.subdomain}/employees?page=1`
		);

		expect(response.json().code).toBe("api_key_expired");
	});

	it("rejects a forged secret for a real prefix", async () => {
		const { company, key } = await managerWithKey();
		const forged = `${key.secret.slice(0, -1)}${key.secret.endsWith("A") ? "B" : "A"}`;

		const response = await withKey(
			forged,
			"GET",
			`/companies/${company.subdomain}/employees?page=1`
		);

		expect(response.statusCode).toBe(401);
		expect(response.json().code).toBe("api_key_credentials_invalid");
	});

	it("follows the owner's current role (a demotion narrows the key once the 60s lookup cache expires)", async () => {
		const { company, key, employee } = await managerWithKey();
		const url = `/companies/${company.subdomain}/employees?page=1`;
		expect((await withKey(key.secret, "GET", url)).statusCode).toBe(200);

		await db
			.update(employees)
			.set({ role: "technician" })
			.where(eq(employees.id, employee.id));
		// Simulate the 60s auth-lookup TTL elapsing (see ApiKeysRepository.getByPrefix).
		await redis.flushdb();

		expect((await withKey(key.secret, "GET", url)).statusCode).toBe(403);
	});
});
