import { describe, expect, it } from "vitest";
import { createClientSchema } from "./clients";
import { issuePaths } from "./test-utils";

const validClient = {
	name: "Maria",
	email: "maria@fixr.test",
	cpf: "52998224725",
	phone: "11999998888",
	address: "Rua A, 1",
	state: "SP",
	city: "São Paulo",
};

describe("createClientSchema", () => {
	it("accepts a valid client", () => {
		expect(createClientSchema.safeParse(validClient).success).toBe(true);
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
			issuePaths(createClientSchema, { ...validClient, [field]: "" })
		).toContain(field);
	});

	it("requires cpf (check digits are only validated in production)", () => {
		const { cpf: _cpf, ...input } = validClient;

		expect(issuePaths(createClientSchema, input)).toEqual(["cpf"]);
	});

	it("limits state to a 2-letter UF", () => {
		expect(
			issuePaths(createClientSchema, { ...validClient, state: "SPX" })
		).toEqual(["state"]);
	});
});
