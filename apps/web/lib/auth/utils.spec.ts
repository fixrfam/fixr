import { cookieKey } from "@fixr/constants/cookies";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { apiUrl, envelope } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import {
	emailDisplayName,
	getClientSession,
	getSession,
	signOut,
} from "./utils";

describe("getClientSession", () => {
	it("returns null without a session cookie", () => {
		expect(getClientSession()).toBeNull();
	});

	it("returns the parsed session, including company.role", () => {
		setSessionCookie(fakeJwt());

		expect(getClientSession()).toMatchObject({
			email: "maria@fixr.test",
			company: { role: "manager", subdomain: "fixr" },
		});
	});

	it.each([
		["a malformed token", "not-a-jwt"],
		[
			"a payload with an unknown role",
			fakeJwt({
				company: { id: "x", name: "x", subdomain: "x", role: "owner" },
			}),
		],
		["a payload without exp", fakeJwt({ exp: undefined })],
	])("returns null for %s", (_label, token) => {
		setSessionCookie(token);

		expect(getClientSession()).toBeNull();
	});
});

describe("getSession", () => {
	it("reads the session from server-side cookies", () => {
		const cookies = {
			get: (name: string) =>
				name === cookieKey("session") ? { name, value: fakeJwt() } : undefined,
		};

		expect(getSession(cookies as never).company?.role).toBe("manager");
	});

	it("reads the session from document.cookie on the client", () => {
		setSessionCookie(fakeJwt());

		expect(getSession().email).toBe("maria@fixr.test");
	});

	it("throws when there is no valid session", () => {
		expect(() => getSession()).toThrow();
	});
});

describe("signOut", () => {
	it("calls GET /auth/signout, forwarding cookies when given", async () => {
		setSessionCookie(fakeJwt());
		const headers: (string | null)[] = [];
		server.use(
			http.get(apiUrl("/auth/signout"), ({ request }) => {
				headers.push(request.headers.get("cookie"));
				return HttpResponse.json(envelope(null, { code: "signout_success" }));
			})
		);

		await signOut();
		await signOut("__refreshToken__fixr=abc");

		expect(headers).toHaveLength(2);
		expect(headers[1]).toContain("__refreshToken__fixr=abc");
	});
});

describe("emailDisplayName", () => {
	it("returns the local part", () => {
		expect(emailDisplayName("ana@fixr.test")).toBe("ana");
	});
});
