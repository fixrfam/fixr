import { parseI18nMessage } from "@fixr/i18n";
import { describe, expect, it } from "vitest";
import { createSupplierSchema } from "./suppliers";
import { issuePaths } from "./test-utils";

const validSupplier = {
	name: "Distribuidora Central",
	cnpj: "11222333000181",
	contact: "Ana",
	phone: "11999998888",
	email: "vendas@central.test",
};

describe("createSupplierSchema", () => {
	it("accepts a valid supplier", () => {
		expect(createSupplierSchema.safeParse(validSupplier).success).toBe(true);
	});

	it.each([
		"name",
		"cnpj",
		"contact",
		"phone",
		"email",
	])("rejects an empty %s", (field) => {
		expect(
			issuePaths(createSupplierSchema, { ...validSupplier, [field]: "" })
		).toContain(field);
	});

	it("rejects an invalid email", () => {
		expect(
			issuePaths(createSupplierSchema, {
				...validSupplier,
				email: "not-an-email",
			})
		).toEqual(["email"]);
	});

	it("limits the name to 120 characters", () => {
		expect(
			issuePaths(createSupplierSchema, {
				...validSupplier,
				name: "x".repeat(121),
			})
		).toEqual(["name"]);
	});

	it("only reports translation keys the catalog knows", () => {
		const result = createSupplierSchema.safeParse({
			name: "",
			cnpj: "",
			contact: "",
			phone: "",
			email: "nope",
		});

		expect(result.success).toBe(false);
		for (const issue of result.error?.issues ?? []) {
			expect(parseI18nMessage(issue.message), issue.path.join(".")).not.toBe(
				null
			);
		}
	});
});
