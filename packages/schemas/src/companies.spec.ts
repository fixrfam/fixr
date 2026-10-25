import { describe, expect, it } from "vitest";
import {
	createCompanySchema,
	getCompanyBySubdomainSchema,
	getCompanyNestedDataSchema,
	updateCompanyProfileSchema,
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

describe("updateCompanyProfileSchema", () => {
	it("accepts a full profile", () => {
		expect(
			updateCompanyProfileSchema.safeParse({
				name: "Fixr Assistência",
				email: "contato@fixr.test",
				phone: "(11) 98765-4321",
				website: "https://fixr.test",
				logoUrl: "https://cdn.fixr.test/logo.png",
			}).success
		).toBe(true);
	});

	it("clears fields with an empty string or null", () => {
		expect(
			updateCompanyProfileSchema.safeParse({
				name: "",
				email: "",
				phone: null,
				website: "",
				logoUrl: null,
			}).success
		).toBe(true);
	});

	it("accepts landlines and mobiles, with or without the mask", () => {
		expect(
			updateCompanyProfileSchema.safeParse({ phone: "1134567890" }).success
		).toBe(true);
		expect(
			updateCompanyProfileSchema.safeParse({ phone: "(11) 3456-7890" }).success
		).toBe(true);
	});

	it.each([
		["phone", "11 9876"],
		["email", "not-an-email"],
		["website", "fixr"],
		["logoUrl", "logo.png"],
	])("rejects an invalid %s", (field, value) => {
		expect(issuePaths(updateCompanyProfileSchema, { [field]: value })).toEqual([
			field,
		]);
	});
});
