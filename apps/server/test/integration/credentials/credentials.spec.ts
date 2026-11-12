import { db, eq } from "@fixr/db/connection";
import { oneTimeTokens } from "@fixr/db/schema";
import { describe, expect, it } from "vitest";
import {
	makeCompany,
	makeCustomerAccount,
	makeEmployee,
} from "../../factories";
import { createTestApp } from "../../helpers/app";
import { authedInject, REFRESH_COOKIE, signSession } from "../../helpers/auth";

const app = await createTestApp();
const NEW_PASSWORD = "Br4nd!NewPass";

const login = (email: string, password: string) =>
	app.inject({
		method: "POST",
		url: "/auth/login",
		payload: { email, password, cfTurnstileToken: "ok" },
	});

/** Log in and return the session's JWT and refresh token. */
async function signIn(email: string, password: string) {
	const response = await login(email, password);
	return {
		jwt: response.json().data.token as string,
		refresh:
			response.cookies.find((c) => c.name === REFRESH_COOKIE)?.value ?? "",
	};
}

/** Exchange a refresh token for a new JWT, as the frontend does. */
const refresh = (token: string) =>
	app.inject({
		method: "POST",
		url: "/auth/token",
		cookies: { [REFRESH_COOKIE]: token },
	});

async function resetTokenFor(email: string) {
	const [row] = await db
		.select()
		.from(oneTimeTokens)
		.where(eq(oneTimeTokens.relatesTo, email));
	return row!;
}

describe("password reset flow", () => {
	it("request -> token in DB -> confirm -> old password fails, new one works", async () => {
		const { user } = await makeCustomerAccount();

		const requested = await app.inject({
			method: "POST",
			url: "/credentials/password/reset",
			payload: { email: user.email, cfTurnstileToken: "ok" },
		});
		expect(requested.statusCode).toBe(201);

		const stored = await resetTokenFor(user.email);
		expect(stored.tokenType).toBe("password_reset");

		const valid = await app.inject({
			method: "GET",
			url: `/credentials/password/reset?token=${encodeURIComponent(stored.token)}`,
		});
		expect(valid.statusCode).toBe(200);
		expect(valid.json().data).toEqual({ valid: true });

		const confirmed = await app.inject({
			method: "PUT",
			url: "/credentials/password/reset",
			payload: {
				token: stored.token,
				password: NEW_PASSWORD,
				cfTurnstileToken: "ok",
			},
		});
		expect(confirmed.statusCode).toBe(200);

		expect((await login(user.email, user.password)).statusCode).toBe(401);
		expect((await login(user.email, NEW_PASSWORD)).statusCode).toBe(200);
	});

	it("the reset token is single-use (enforced in the database)", async () => {
		const { user } = await makeCustomerAccount();
		await app.inject({
			method: "POST",
			url: "/credentials/password/reset",
			payload: { email: user.email, cfTurnstileToken: "ok" },
		});
		const { token } = await resetTokenFor(user.email);
		const confirm = () =>
			app.inject({
				method: "PUT",
				url: "/credentials/password/reset",
				payload: { token, password: NEW_PASSWORD, cfTurnstileToken: "ok" },
			});

		expect((await confirm()).statusCode).toBe(200);
		const second = await confirm();

		expect(second.statusCode).toBe(404);
		expect(second.json().code).toBe("token_not_found");
	});

	it("rejects a second request while a reset is pending", async () => {
		const { user } = await makeCustomerAccount();
		const request = () =>
			app.inject({
				method: "POST",
				url: "/credentials/password/reset",
				payload: { email: user.email, cfTurnstileToken: "ok" },
			});

		await request();
		const second = await request();

		expect(second.statusCode).toBe(409);
	});

	it("ends every session the account had before the reset", async () => {
		const { user } = await makeCustomerAccount();
		const before = await signIn(user.email, user.password);

		await app.inject({
			method: "POST",
			url: "/credentials/password/reset",
			payload: { email: user.email, cfTurnstileToken: "ok" },
		});
		const { token } = await resetTokenFor(user.email);
		await app.inject({
			method: "PUT",
			url: "/credentials/password/reset",
			payload: { token, password: NEW_PASSWORD, cfTurnstileToken: "ok" },
		});

		expect((await refresh(before.refresh)).statusCode).toBe(401);
	});

	it("rejects a weak new password with request_validation_error", async () => {
		const response = await app.inject({
			method: "PUT",
			url: "/credentials/password/reset",
			payload: { token: "x", password: "weak", cfTurnstileToken: "ok" },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().code).toBe("request_validation_error");
	});
});

describe("PUT /credentials/password", () => {
	it("changes the password of the authenticated user", async () => {
		const company = await makeCompany();
		const employee = await makeEmployee({ company, role: "technician" });
		const token = signSession(app, {
			id: employee.user.id,
			email: employee.user.email,
		});

		const response = await authedInject(app, token, {
			method: "PUT",
			url: "/credentials/password",
			payload: { old: employee.user.password, new: NEW_PASSWORD },
		});

		expect(response.statusCode).toBe(200);
		expect((await login(employee.user.email, NEW_PASSWORD)).statusCode).toBe(
			200
		);
	});

	it("signs out the other sessions and keeps the one that changed it", async () => {
		const { user } = await makeCustomerAccount();
		const other = await signIn(user.email, user.password);
		const current = await signIn(user.email, user.password);

		const response = await authedInject(app, current.jwt, {
			method: "PUT",
			url: "/credentials/password",
			payload: { old: user.password, new: NEW_PASSWORD },
			cookies: { [REFRESH_COOKIE]: current.refresh },
		});

		expect(response.statusCode).toBe(200);
		expect((await refresh(other.refresh)).statusCode).toBe(401);
		expect((await refresh(current.refresh)).statusCode).toBe(200);
	});

	it("requires the current password", async () => {
		const { user } = await makeCustomerAccount();
		const token = signSession(app, { id: user.id, email: user.email });

		const response = await authedInject(app, token, {
			method: "PUT",
			url: "/credentials/password",
			payload: { old: "Wr0ng!Pass", new: NEW_PASSWORD },
		});

		expect(response.statusCode).toBe(401);
		expect(response.json().code).toBe("invalid_password");
	});

	it("returns 401 without a session", async () => {
		const response = await app.inject({
			method: "PUT",
			url: "/credentials/password",
			payload: { old: "x", new: NEW_PASSWORD },
		});

		expect(response.statusCode).toBe(401);
	});
});
