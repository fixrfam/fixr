import { describe, expect, it } from "vitest";
import { formatDate } from "./format";

describe("formatDate", () => {
	it("formats Date, ISO string and timestamp inputs", () => {
		const expected = "January 15, 2024";

		expect(formatDate(new Date(2024, 0, 15))).toBe(expected);
		expect(formatDate("2024-01-15T12:00:00")).toBe(expected);
		expect(formatDate(new Date(2024, 0, 15).getTime())).toBe(expected);
	});

	it("honours custom options", () => {
		expect(formatDate(new Date(2024, 0, 15), { month: "short" })).toBe(
			"Jan 15, 2024"
		);
	});

	it.each([
		["undefined", undefined],
		["an empty string", ""],
		["zero", 0],
		["an invalid date", "not a date"],
	])("returns an empty string for %s", (_label, value) => {
		expect(formatDate(value)).toBe("");
	});
});
