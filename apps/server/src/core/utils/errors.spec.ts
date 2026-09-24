import { describe, expect, it } from "vitest";
import { errors } from "../errors";
import { defineErrors, errorSchema } from "./errors";

describe("defineErrors", () => {
	it("returns the registry unchanged (type-level helper)", () => {
		const registry = { X: { code: "x", message: "X", status: 400 } };

		expect(defineErrors(registry)).toBe(registry);
	});

	it("rejects an unknown key at compile time", () => {
		const registry = defineErrors({
			X: { code: "x", message: "X", status: 400 },
		});

		// @ts-expect-error unknown key
		expect(registry.Y).toBeUndefined();
	});
});

describe("central error registry", () => {
	it.each(
		Object.entries(errors)
	)("%s is a valid error definition", (_key, value) => {
		expect(errorSchema.safeParse(value).success).toBe(true);
		expect(value.status).toBeGreaterThanOrEqual(400);
		expect(value.status).toBeLessThan(600);
	});

	it("uses snake_case codes", () => {
		for (const { code } of Object.values(errors)) {
			expect(code).toMatch(/^[a-z0-9_]+$/);
		}
	});
});
