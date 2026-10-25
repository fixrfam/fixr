import { describe, expect, it } from "vitest";
import {
	extractApiKeyToken,
	generateApiKey,
	hashApiKeySecret,
} from "./api-key";

describe("extractApiKeyToken", () => {
	it("prefers the x-api-key header", () => {
		expect(
			extractApiKeyToken({
				"x-api-key": "fxr_a",
				authorization: "Bearer fxr_b",
			})
		).toBe("fxr_a");
	});

	it("falls back to a bearer token", () => {
		expect(extractApiKeyToken({ authorization: "Bearer fxr_b" })).toBe("fxr_b");
	});

	it.each([
		["no header", {}],
		["an empty x-api-key", { "x-api-key": "" }],
		["a repeated x-api-key header", { "x-api-key": ["a", "b"] }],
		["a non-bearer authorization", { authorization: "Basic abc" }],
	])("returns null for %s", (_label, headers) => {
		expect(extractApiKeyToken(headers as never)).toBeNull();
	});
});

describe("generateApiKey", () => {
	it("never returns the secret in its stored form", () => {
		const key = generateApiKey();
		const secret = key.token.slice(`fxr_${key.prefix}_`.length);

		expect(key.token.startsWith(`fxr_${key.prefix}_`)).toBe(true);
		expect(key.keyHash).toBe(hashApiKeySecret(secret));
		expect(key.keyHash).not.toContain(secret);
		expect(key.prefix).toHaveLength(12);
	});

	it("generates unique prefixes and secrets", () => {
		const keys = Array.from({ length: 100 }, generateApiKey);

		expect(new Set(keys.map((k) => k.prefix)).size).toBe(100);
		expect(new Set(keys.map((k) => k.token)).size).toBe(100);
	});
});
