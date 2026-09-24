import { describe, expect, it } from "vitest";
import { generateId } from "./id";

describe("generateId", () => {
	it("generates 12 alphanumeric chars by default", () => {
		expect(generateId()).toMatch(/^[0-9A-Za-z]{12}$/);
	});

	it("honours a custom length", () => {
		expect(generateId({ length: 20 })).toHaveLength(20);
		expect(generateId("unknown", { length: 5 })).toHaveLength(5);
	});

	it("ignores unknown prefixes", () => {
		expect(generateId("user")).toMatch(/^[0-9A-Za-z]{12}$/);
	});

	it("is unique across calls", () => {
		const ids = new Set(Array.from({ length: 200 }, () => generateId()));
		expect(ids.size).toBe(200);
	});
});
