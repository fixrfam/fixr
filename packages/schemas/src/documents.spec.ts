import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { documentSchema, isValidCNPJ, isValidCPF } from "./documents";

const VALID_CPF = "52998224725";
const VALID_CNPJ = "11222333000181";

describe("isValidCPF", () => {
	it("accepts a valid CPF with and without mask", () => {
		expect(isValidCPF(VALID_CPF)).toBe(true);
		expect(isValidCPF("529.982.247-25")).toBe(true);
	});

	it.each([
		["wrong first check digit", "52998224735"],
		["wrong second check digit", "52998224726"],
		["repeated digits", "111.111.111-11"],
		["all zeros", "00000000000"],
		["too short", "5299822472"],
		["too long", "529982247250"],
		["empty", ""],
		["letters", "abc.def.ghi-jk"],
	])("rejects %s", (_label, value) => {
		expect(isValidCPF(value)).toBe(false);
	});

	it("accepts a CPF whose check digit remainder is 10 (becomes 0)", () => {
		// 1st digit remainder is 10 -> check digit 0
		expect(isValidCPF("12345678909")).toBe(true);
	});
});

describe("isValidCNPJ", () => {
	it("accepts a valid CNPJ with and without mask", () => {
		expect(isValidCNPJ(VALID_CNPJ)).toBe(true);
		expect(isValidCNPJ("11.222.333/0001-81")).toBe(true);
	});

	it.each([
		["wrong first check digit", "11222333000191"],
		["wrong second check digit", "11222333000182"],
		["repeated digits", "11.111.111/1111-11"],
		["too short", "1122233300018"],
		["too long", "112223330001810"],
		["empty", ""],
	])("rejects %s", (_label, value) => {
		expect(isValidCNPJ(value)).toBe(false);
	});
});

describe("documentSchema", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	describe("in production", () => {
		beforeEach(() => {
			vi.stubEnv("NODE_ENV", "production");
		});

		it("validates the CPF check digits", () => {
			expect(documentSchema("cpf").safeParse(VALID_CPF).success).toBe(true);
			expect(documentSchema("cpf").safeParse("111.111.111-11").success).toBe(
				false
			);
		});

		it("validates the CNPJ check digits", () => {
			expect(documentSchema("cnpj").safeParse(VALID_CNPJ).success).toBe(true);
			expect(documentSchema("cnpj").safeParse("11222333000182").success).toBe(
				false
			);
		});

		it("does not accept a CPF where a CNPJ is expected", () => {
			expect(documentSchema("cnpj").safeParse(VALID_CPF).success).toBe(false);
		});

		it("honours NEXT_PUBLIC_APP_ENV over NODE_ENV", () => {
			vi.stubEnv("NEXT_PUBLIC_APP_ENV", "development");

			expect(documentSchema("cpf").safeParse("123").success).toBe(true);
		});
	});

	describe("outside production", () => {
		beforeEach(() => {
			vi.stubEnv("NODE_ENV", "development");
		});

		it("skips the check-digit validation (only the string type is enforced)", () => {
			expect(documentSchema("cpf").safeParse("123").success).toBe(true);
			expect(documentSchema("cpf").safeParse(123).success).toBe(false);
		});
	});
});
