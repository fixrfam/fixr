import { describe, expect, it } from "vitest";
import { createCustomerSchema } from "./customers";
import { issuePaths } from "./test-utils";

const validCustomer = {
	name: "Maria",
	email: "maria@fixr.test",
	cpf: "52998224725",
	phone: "11999998888",
	address: "Rua A, 1",
	state: "SP",
	city: "São Paulo",
};

describe("createCustomerSchema", () => {
	it("accepts a valid customer", () => {
		expect(createCustomerSchema.safeParse(validCustomer).success).toBe(true);
	});

	it.each([
		"name",
		"email",
		"phone",
		"address",
		"state",
		"city",
	])("rejects an empty %s", (field) => {
		expect(
			issuePaths(createCustomerSchema, { ...validCustomer, [field]: "" })
		).toContain(field);
	});

	it("requires cpf (check digits are only validated in production)", () => {
		const { cpf: _cpf, ...input } = validCustomer;

		expect(issuePaths(createCustomerSchema, input)).toEqual(["cpf"]);
	});

	it("limits state to a 2-letter UF", () => {
		expect(
			issuePaths(createCustomerSchema, { ...validCustomer, state: "SPX" })
		).toEqual(["state"]);
	});
});
