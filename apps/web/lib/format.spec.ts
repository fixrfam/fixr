import { describe, expect, it } from "vitest";
import { formatCnpj, formatCpf, formatDate, formatPhone } from "./format";

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

describe("formatPhone", () => {
	it("formats mobile and landline digits", () => {
		expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
		expect(formatPhone("1134567890")).toBe("(11) 3456-7890");
	});

	it("passes other values through", () => {
		expect(formatPhone("123")).toBe("123");
		expect(formatPhone(null)).toBe("");
	});
});

describe("formatCnpj", () => {
	it("formats 14 digits", () => {
		expect(formatCnpj("12345678000190")).toBe("12.345.678/0001-90");
	});

	it("passes other values through", () => {
		expect(formatCnpj("123")).toBe("123");
	});
});

describe("formatCpf", () => {
	it("formats stored digits and passes anything else through", () => {
		expect(formatCpf("52998224725")).toBe("529.982.247-25");
		expect(formatCpf("123")).toBe("123");
		expect(formatCpf(null)).toBe("");
	});
});
