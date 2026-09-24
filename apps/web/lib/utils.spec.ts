import { describe, expect, it } from "vitest";
import { fakeJwt } from "@/test/jwt";
import { api, cn, firstUpper, isClientSide, parseJwt, tryCatch } from "./utils";

describe("cn", () => {
	it("merges conditional classes and resolves Tailwind conflicts", () => {
		expect(cn("p-2", false, "p-4", ["text-sm"])).toBe("p-4 text-sm");
	});
});

describe("api", () => {
	it("prefixes the path with NEXT_PUBLIC_API_URL", () => {
		expect(api("/auth/login")).toBe("http://api.test/auth/login");
	});
});

describe("parseJwt", () => {
	it("decodes the payload of a JWT (including UTF-8)", () => {
		const token = fakeJwt({ displayName: "João" });

		expect(parseJwt(token)).toMatchObject({
			displayName: "João",
			email: "maria@fixr.test",
		});
	});

	it.each([
		["undefined", undefined],
		["an empty string", ""],
		["a token without payload", "header"],
		["a non-base64 payload", "a.%%%.c"],
		["a non-JSON payload", `a.${btoa("not json")}.c`],
	])("returns null for %s", (_label, token) => {
		expect(parseJwt(token)).toBeNull();
	});
});

describe("tryCatch", () => {
	it("wraps a resolved promise", async () => {
		expect(await tryCatch(Promise.resolve("ok"))).toEqual({
			data: "ok",
			error: null,
		});
	});

	it("wraps a rejected promise", async () => {
		const error = new Error("fail");
		expect(await tryCatch(Promise.reject(error))).toEqual({
			data: null,
			error,
		});
	});
});

describe("misc", () => {
	it("firstUpper capitalizes the first letter only", () => {
		expect(firstUpper("fixr app")).toBe("Fixr app");
		expect(firstUpper("")).toBe("");
	});

	it("isClientSide is true under jsdom", () => {
		expect(isClientSide()).toBe(true);
	});
});
