import { describe, expect, it } from "vitest";
import { generateOpaqueToken, hashOpaqueToken } from "./opaque-token";

describe("opaque tokens", () => {
	it("generates distinct url-safe tokens", () => {
		const a = generateOpaqueToken();

		expect(a).toMatch(/^[\w-]{43}$/);
		expect(generateOpaqueToken()).not.toBe(a);
	});

	it("hashes deterministically without containing the token", () => {
		const token = generateOpaqueToken();

		expect(hashOpaqueToken(token)).toBe(hashOpaqueToken(token));
		expect(hashOpaqueToken(token)).toHaveLength(64);
		expect(hashOpaqueToken(token)).not.toContain(token);
	});
});
