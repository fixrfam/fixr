import { describe, expect, it } from "vitest";
import { cnpj, cpf, phone, unmask } from "./masks";

describe("unmask", () => {
	it("strips every non-digit from CPF and CNPJ", () => {
		expect(unmask.cpf("529.982.247-25")).toBe("52998224725");
		expect(unmask.cnpj("11.222.333/0001-81")).toBe("11222333000181");
	});

	it("strips the phone mask and keeps null/undefined as is", () => {
		expect(unmask.phone("(11) 99999-8888")).toBe("11999998888");
		expect(unmask.phone(undefined)).toBeUndefined();
		expect(unmask.phone(null)).toBeUndefined();
	});
});

describe("mask definitions", () => {
	it.each([
		["cpf", cpf, 11, 14],
		["cnpj", cnpj, 14, 18],
		["phone", phone, 11, 15],
	])("%s mask has the expected digit slots and length", (_name, mask, digits, length) => {
		expect(mask.filter((slot) => slot instanceof RegExp)).toHaveLength(digits);
		expect(mask).toHaveLength(length);
	});
});
