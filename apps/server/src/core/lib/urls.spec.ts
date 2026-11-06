import { env } from "@fixr/env/server";
import { describe, expect, it } from "vitest";
import { apiUrl, frontendRedirect } from "./urls";

const frontend = new URL(env.FRONTEND_URL).origin;
const login = `${env.FRONTEND_URL.replace(/\/$/, "")}/auth/login`;

describe("frontendRedirect", () => {
	it("keeps a URL on the frontend", () => {
		expect(frontendRedirect(`${frontend}/auth/login?x=1`)).toBe(
			`${frontend}/auth/login?x=1`
		);
	});

	it("resolves a path against the frontend", () => {
		expect(frontendRedirect("/dashboard")).toBe(`${frontend}/dashboard`);
	});

	it.each([
		"https://attacker.example/phish",
		"//attacker.example/phish",
		`${frontend}.attacker.example/`,
		"javascript:alert(1)",
	])("sends %s to the login page instead", (target) => {
		expect(frontendRedirect(target)).toBe(login);
	});

	it("uses the login page when there is no target", () => {
		expect(frontendRedirect(undefined)).toBe(login);
	});
});

describe("apiUrl", () => {
	it("builds from the configured origin, not the request", () => {
		const origin = new URL(env.API_URL ?? env.GOOGLE_AUTH_REDIRECT_URI).origin;
		expect(apiUrl("/auth/verify?token=a")).toBe(
			`${origin}/auth/verify?token=a`
		);
	});
});
