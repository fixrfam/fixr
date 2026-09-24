import { accountSchema } from "@fixr/schemas/account";
import { describe, expect, it } from "vitest";
import { makeClient, makeCompany, makeEmployee } from "../../factories";
import { createTestApp } from "../../helpers/app";
import {
	authedInject,
	createEmployeeSession,
	SESSION_COOKIE,
	signSession,
} from "../../helpers/auth";

const app = await createTestApp();

describe("GET /account", () => {
	it("returns the authenticated employee's account matching accountSchema", async () => {
		const { token, employee, company } = await createEmployeeSession(app, {
			role: "technician",
		});

		const response = await authedInject(app, token, {
			method: "GET",
			url: "/account",
		});

		expect(response.statusCode).toBe(200);
		const account = accountSchema.parse(response.json().data);
		expect(account).toMatchObject({
			id: employee.user.id,
			email: employee.user.email,
			profileType: "employee",
			company: { id: company.id, role: "technician" },
		});
	});

	it("returns 401 without a session", async () => {
		const response = await app.inject({ method: "GET", url: "/account" });

		expect(response.statusCode).toBe(401);
		expect(response.json().code).toBe("auth_jwt_invalid");
	});

	// A client (non-employee) has the guest ability, which lacks account:read.
	it("is forbidden for client accounts (guest ability)", async () => {
		const { user } = await makeClient();
		const token = signSession(app, { id: user.id, email: user.email });

		const response = await authedInject(app, token, {
			method: "GET",
			url: "/account",
		});

		expect(response.statusCode).toBe(403);
	});
});

describe("PUT/DELETE /account/avatar", () => {
	it("persists the avatar, refreshes the session cookie and the re-read reflects it", async () => {
		const { token } = await createEmployeeSession(app, { role: "technician" });
		const url = "https://cdn.test.local/users/me/avatar.png";

		const updated = await authedInject(app, token, {
			method: "PUT",
			url: "/account/avatar",
			payload: { url },
		});

		expect(updated.statusCode).toBe(200);
		expect(
			updated.cookies.find((c) => c.name === SESSION_COOKIE)
		).toBeDefined();
		const reread = await authedInject(app, token, {
			method: "GET",
			url: "/account",
		});
		expect(reread.json().data.avatarUrl).toBe(url);

		const removed = await authedInject(app, token, {
			method: "DELETE",
			url: "/account/avatar",
		});
		expect(removed.statusCode).toBe(200);
		const rereadAfterDelete = await authedInject(app, token, {
			method: "GET",
			url: "/account",
		});
		expect(rereadAfterDelete.json().data.avatarUrl).toBeNull();
	});

	it("rejects an invalid avatar URL", async () => {
		const { token } = await createEmployeeSession(app, { role: "technician" });

		const response = await authedInject(app, token, {
			method: "PUT",
			url: "/account/avatar",
			payload: { url: "not a url" },
		});

		expect(response.statusCode).toBe(400);
	});
});

describe("account isolation", () => {
	it("user A only ever reads and writes their own account", async () => {
		const company = await makeCompany();
		const a = await makeEmployee({ company, role: "technician" });
		const b = await makeEmployee({ company, role: "technician" });
		const tokenA = signSession(app, {
			id: a.user.id,
			email: a.user.email,
			company: {
				id: company.id,
				name: company.name,
				subdomain: company.subdomain,
				role: "technician",
			},
		});

		const read = await authedInject(app, tokenA, {
			method: "GET",
			url: "/account",
		});
		await authedInject(app, tokenA, {
			method: "PUT",
			url: "/account/avatar",
			payload: { url: "https://cdn.test.local/a.png" },
		});

		expect(read.json().data.id).toBe(a.user.id);
		const tokenB = signSession(app, {
			id: b.user.id,
			email: b.user.email,
			company: {
				id: company.id,
				name: company.name,
				subdomain: company.subdomain,
				role: "technician",
			},
		});
		const readB = await authedInject(app, tokenB, {
			method: "GET",
			url: "/account",
		});
		expect(readB.json().data.avatarUrl).toBeNull();
	});
});

describe("account deletion", () => {
	// No role holds account:delete today (see UNASSIGNED_PERMISSIONS in @fixr/permissions).
	it("POST /account/request-deletion is forbidden for every role", async () => {
		const { token } = await createEmployeeSession(app, { role: "admin" });

		const response = await authedInject(app, token, {
			method: "POST",
			url: "/account/request-deletion",
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().code).toBe("missing_required_permissions");
	});

	it("GET /account/confirm-deletion rejects an unknown token", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/account/confirm-deletion?token=unknown",
		});

		expect(response.statusCode).toBe(404);
	});
});
