import { describe, expect, it } from "vitest";
import {
	createCompanySchema,
	getCompanyBySubdomainSchema,
	getCompanyNestedDataSchema,
} from "./companies";
import { issuePaths } from "./test-utils";

const validCompany = {
	name: "Fixr Assistência",
	cnpj: "11222333000181",
	subdomain: "fixr",
	owner_cpf: "52998224725",
	owner_email: "owner@fixr.test",
	owner_password: "Str0ng!Pass",
};

describe("createCompanySchema", () => {
	it("accepts a valid company (address optional or empty)", () => {
		expect(createCompanySchema.safeParse(validCompany).success).toBe(true);
		expect(
			createCompanySchema.safeParse({ ...validCompany, address: "" }).success
		).toBe(true);
	});

	it.each([
		"name",
		"cnpj",
		"subdomain",
		"owner_cpf",
		"owner_email",
		"owner_password",
	])("requires %s", (field) => {
		const input: Record<string, unknown> = { ...validCompany };
		delete input[field];

		expect(issuePaths(createCompanySchema, input)).toContain(field);
	});

	it("rejects a weak owner password", () => {
		expect(
			issuePaths(createCompanySchema, {
				...validCompany,
				owner_password: "weak",
			})
		).toContain("owner_password");
	});

	it("rejects a too short address", () => {
		expect(
			issuePaths(createCompanySchema, { ...validCompany, address: "ab" })
		).toEqual(["address"]);
	});
});

describe.each([
	["getCompanyBySubdomainSchema", getCompanyBySubdomainSchema],
	["getCompanyNestedDataSchema", getCompanyNestedDataSchema],
	["createCompanySchema.subdomain", createCompanySchema.shape.subdomain],
])("%s subdomain rules", (_name, schema) => {
	const parse = (subdomain: string) =>
		"shape" in schema
			? schema.safeParse({ subdomain }).success
			: schema.safeParse(subdomain).success;

	it.each(["fixr", "fixr-sp", "a", "a1-b2", "0abc"])("accepts %s", (value) => {
		expect(parse(value)).toBe(true);
	});

	it.each([
		["uppercase", "Fixr"],
		["leading hyphen", "-fixr"],
		["trailing hyphen", "fixr-"],
		["dot", "fixr.sp"],
		["underscore", "fix_r"],
		["empty", ""],
		["over 63 chars", "a".repeat(64)],
		["whitespace", " fixr"],
	])("rejects %s", (_label, value) => {
		expect(parse(value)).toBe(false);
	});
});
