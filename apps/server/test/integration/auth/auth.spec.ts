import { cookieKey } from "@fixr/constants/cookies";
import { db, eq } from "@fixr/db/connection";
import { oneTimeTokens, refreshTokens, users } from "@fixr/db/schema";
import { describe, expect, it } from "vitest";
import { TokensService } from "@/src/modules/tokens/services";
import {
	DEFAULT_PASSWORD,
	makeClient,
	makeCompany,
	makeEmployee,
} from "../../factories";
import { createTestApp } from "../../helpers/app";
import { REFRESH_COOKIE, SESSION_COOKIE } from "../../helpers/auth";

const app = await createTestApp();

const login = (email: string, password: string) =>
	app.inject({
		method: "POST",
		url: "/auth/login",
		payload: { email, password, cfTurnstileToken: "ok" },
	});

const cookie = (response: Awaited<ReturnType<typeof login>>, name: string) =>
	response.cookies.find((c) => c.name === name);

describe("POST /auth/register", () => {
	it("is disabled (public sign-up is not available)", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/auth/register",
			payload: {
				email: "new@fixr.test",
				password: DEFAULT_PASSWORD,
				cfTurnstileToken: "ok",
			},
		});

		expect(response.statusCode).toBe(501);
		expect(response.json()).toMatchObject({ code: "not_implemented" });
		expect(await db.select().from(users)).toHaveLength(0);
	});

	it("validates the body before answering", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/auth/register",
			payload: { email: "nope" },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().code).toBe("request_validation_error");
	});
});

describe("POST /auth/login", () => {
	it("sets session and refresh cookies with secure flags and persists the refresh token", async () => {
		const company = await makeCompany();
		const employee = await makeEmployee({ company, role: "manager" });

		const response = await login(employee.user.email, DEFAULT_PASSWORD);

		expect(response.statusCode).toBe(200);
		expect(response.json()).toMatchObject({ code: "login_success" });

		const session = cookie(response, SESSION_COOKIE);
		const refresh = cookie(response, REFRESH_COOKIE);
		expect(SESSION_COOKIE).toBe(cookieKey("session"));
		expect(session).toMatchObject({
			secure: true,
			sameSite: "None",
			path: "/",
		});
		expect(session?.httpOnly).toBeFalsy();
		expect(refresh).toMatchObject({
			httpOnly: true,
			secure: true,
			sameSite: "None",
		});

		const [stored] = await db
			.select()
			.from(refreshTokens)
			.where(eq(refreshTokens.token, refresh!.value));
		expect(stored?.userId).toBe(employee.user.id);

		const payload = app.jwt.decode<{ company: { role: string; id: string } }>(
			session!.value
		);
		expect(payload?.company).toMatchObject({ role: "manager", id: company.id });
	});

	it("matches the email case-insensitively", async () => {
		const { user } = await makeClient({ email: "mixed@fixr.test" });

		const response = await login("MIXED@fixr.test", user.password);

		expect(response.statusCode).toBe(200);
	});

	it("rejects a wrong password with 401", async () => {
		const { user } = await makeClient();

		const response = await login(user.email, "Wr0ng!Pass");

		expect(response.statusCode).toBe(401);
		expect(response.json().code).toBe("invalid_password");
		expect(response.cookies).toHaveLength(0);
	});

	it("rejects an unknown email with 404", async () => {
		const response = await login("ghost@fixr.test", DEFAULT_PASSWORD);

		expect(response.statusCode).toBe(404);
		expect(response.json().code).toBe("user_not_found");
	});

	it("rejects an unverified account with 403", async () => {
		const { user } = await makeClient({ verified: false });

		const response = await login(user.email, user.password);

		expect(response.statusCode).toBe(403);
		expect(response.json().code).toBe("email_not_verified");
	});

	it("rejects a malformed body with request_validation_error", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/auth/login",
			payload: { email: "not-an-email" },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json()).toMatchObject({
			code: "request_validation_error",
			data: { method: "POST", url: "/auth/login" },
		});
	});
});

describe("GET /auth/verify", () => {
	it("verifies the account with a real confirmation token and consumes it", async () => {
		const { user } = await makeClient({ verified: false });
		const { token } = await TokensService.createOneTimeToken({
			userId: user.id,
			email: user.email,
			tokenType: "confirmation",
		});

		const response = await app.inject({
			method: "GET",
			url: `/auth/verify?token=${encodeURIComponent(token)}`,
		});

		expect(response.statusCode).toBe(200);
		const [stored] = await db.select().from(users).where(eq(users.id, user.id));
		expect(stored?.verified).toBe(true);
		expect(await db.select().from(oneTimeTokens)).toHaveLength(0);

		const reused = await app.inject({
			method: "GET",
			url: `/auth/verify?token=${encodeURIComponent(token)}`,
		});
		expect(reused.statusCode).toBe(404);
	});

	it("redirects when a redirectUrl is given", async () => {
		const { user } = await makeClient({ verified: false });
		const { token } = await TokensService.createOneTimeToken({
			userId: user.id,
			email: user.email,
			tokenType: "confirmation",
		});

		const response = await app.inject({
			method: "GET",
			url: `/auth/verify?token=${encodeURIComponent(token)}&redirectUrl=${encodeURIComponent("http://localhost:3000/auth/login")}`,
		});

		expect(response.statusCode).toBe(302);
		expect(response.headers.location).toBe("http://localhost:3000/auth/login");
	});

	it("rejects a password reset token", async () => {
		const { user } = await makeClient({ verified: false });
		const { token } = await TokensService.createOneTimeToken({
			userId: user.id,
			email: user.email,
			tokenType: "password_reset",
		});

		const response = await app.inject({
			method: "GET",
			url: `/auth/verify?token=${encodeURIComponent(token)}`,
		});

		expect(response.statusCode).toBe(400);
	});
});

describe("refresh token lifecycle", () => {
	it("POST /auth/token rotates the refresh token and the old one stops working", async () => {
		const { user } = await makeClient();
		const first = await login(user.email, user.password);
		const oldRefresh = cookie(first, REFRESH_COOKIE)!.value;

		const rotated = await app.inject({
			method: "POST",
			url: "/auth/token",
			cookies: { [REFRESH_COOKIE]: oldRefresh },
		});

		expect(rotated.statusCode).toBe(200);
		const newRefresh = cookie(rotated, REFRESH_COOKIE)!.value;
		expect(newRefresh).not.toBe(oldRefresh);
		expect(rotated.json().data.token).toEqual(expect.any(String));

		const replay = await app.inject({
			method: "POST",
			url: "/auth/token",
			cookies: { [REFRESH_COOKIE]: oldRefresh },
		});
		expect(replay.statusCode).toBe(401);
		expect(replay.json().code).toBe("invalid_refresh");
	});

	it("POST /auth/token without cookie is a 400", async () => {
		const response = await app.inject({ method: "POST", url: "/auth/token" });

		expect(response.statusCode).toBe(400);
		expect(response.json().code).toBe("no_refresh_provided");
	});

	it("GET /auth/signout revokes the refresh token in the database", async () => {
		const { user } = await makeClient();
		const refresh = cookie(
			await login(user.email, user.password),
			REFRESH_COOKIE
		)!.value;

		const response = await app.inject({
			method: "GET",
			url: "/auth/signout",
			cookies: { [REFRESH_COOKIE]: refresh },
		});

		expect(response.statusCode).toBe(200);
		expect(
			await db
				.select()
				.from(refreshTokens)
				.where(eq(refreshTokens.token, refresh))
		).toHaveLength(0);
	});

	it("keeps other sessions of the same user alive", async () => {
		const { user } = await makeClient();
		const a = cookie(
			await login(user.email, user.password),
			REFRESH_COOKIE
		)!.value;
		const b = cookie(
			await login(user.email, user.password),
			REFRESH_COOKIE
		)!.value;

		await app.inject({
			method: "GET",
			url: "/auth/signout",
			cookies: { [REFRESH_COOKIE]: a },
		});

		const stillValid = await app.inject({
			method: "POST",
			url: "/auth/token",
			cookies: { [REFRESH_COOKIE]: b },
		});
		expect(stillValid.statusCode).toBe(200);
	});
});

describe("GET /auth/google", () => {
	it("redirects to Google", async () => {
		const response = await app.inject({ method: "GET", url: "/auth/google" });

		expect(response.statusCode).toBe(302);
		expect(response.headers.location).toMatch(
			/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/
		);
	});
});
