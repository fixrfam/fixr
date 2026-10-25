import { describe, expect, it } from "vitest";
import { cnpj, cpf, formattedCnpj, formattedIMEI } from "./common";

describe("common format schemas", () => {
	it.each([
		[cpf, "529.982.247-25"],
		[cpf, "52998224725"],
		[cnpj, "11.222.333/0001-81"],
		[formattedCnpj, "11222333000181"],
		[formattedIMEI, "356938035643809"],
	])("accepts %#", (schema, value) => {
		expect(schema.safeParse(value).success).toBe(true);
	});

	it.each([
		[cpf, "529.982"],
		[cnpj, "11.222.333"],
		[formattedIMEI, "12345"],
	])("rejects malformed value %#", (schema, value) => {
		expect(schema.safeParse(value).success).toBe(false);
	});

	it("only checks the format, not the check digits", () => {
		// Check-digit validation lives in documentSchema; this is a format-only regex.
		expect(cpf.safeParse("111.111.111-11").success).toBe(true);
	});
});
