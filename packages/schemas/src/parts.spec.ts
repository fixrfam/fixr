import { parseI18nMessage } from "@fixr/i18n";
import { describe, expect, it } from "vitest";
import {
	adjustPartStockSchema,
	createPartSchema,
	patchPartSchema,
} from "./parts";
import { issuePaths } from "./test-utils";

const validPart = {
	sku: "SCR-IP13-OLED",
	name: "iPhone 13 OLED screen",
	category: "screens",
	costPrice: 350,
	salePrice: 600,
	stock: 4,
	minStock: 2,
	supplierId: "sup_1",
};

describe("createPartSchema", () => {
	it("accepts a valid part", () => {
		expect(createPartSchema.safeParse(validPart).success).toBe(true);
	});

	it.each([
		"sku",
		"name",
		"category",
		"supplierId",
	])("rejects an empty %s", (field) => {
		expect(
			issuePaths(createPartSchema, { ...validPart, [field]: "" })
		).toContain(field);
	});

	it.each([
		["sku", 51],
		["name", 121],
	])("limits %s to %i characters", (field, length) => {
		expect(
			issuePaths(createPartSchema, {
				...validPart,
				[field]: "x".repeat(length),
			})
		).toEqual([field]);
	});

	it.each([
		"costPrice",
		"salePrice",
		"stock",
		"minStock",
	])("rejects a negative %s", (field) => {
		expect(
			issuePaths(createPartSchema, { ...validPart, [field]: -1 })
		).toContain(field);
	});

	it.each(["stock", "minStock"])("only accepts whole units in %s", (field) => {
		expect(
			issuePaths(createPartSchema, { ...validPart, [field]: 1.5 })
		).toEqual([field]);
	});

	it("accepts cents in prices", () => {
		expect(
			createPartSchema.safeParse({
				...validPart,
				costPrice: 10.25,
				salePrice: 19.9,
			}).success
		).toBe(true);
	});

	it("rejects prices sent as text", () => {
		expect(
			issuePaths(createPartSchema, { ...validPart, costPrice: "10" })
		).toContain("costPrice");
	});

	it("rejects a sale price below the cost, on salePrice", () => {
		expect(
			issuePaths(createPartSchema, {
				...validPart,
				costPrice: 100,
				salePrice: 99.99,
			})
		).toEqual(["salePrice"]);
	});

	it("allows selling at cost", () => {
		expect(
			createPartSchema.safeParse({ ...validPart, costPrice: 50, salePrice: 50 })
				.success
		).toBe(true);
	});

	it("only reports translation keys the catalog knows", () => {
		const result = createPartSchema.safeParse({
			sku: "",
			name: "",
			category: "",
			costPrice: -1,
			salePrice: "x",
			stock: 1.5,
			minStock: -1,
			supplierId: "",
		});

		expect(result.success).toBe(false);
		for (const issue of result.error?.issues ?? []) {
			expect(parseI18nMessage(issue.message), issue.path.join(".")).not.toBe(
				null
			);
		}
	});
});

describe("patchPartSchema", () => {
	it("accepts a partial update", () => {
		expect(patchPartSchema.safeParse({ minStock: 3 }).success).toBe(true);
	});

	it("drops the stock, which only changes through an adjustment", () => {
		expect(patchPartSchema.parse({ name: "Screen", stock: 3 })).toEqual({
			name: "Screen",
		});
	});

	it("only checks the price rule when both prices are sent", () => {
		expect(patchPartSchema.safeParse({ salePrice: 10 }).success).toBe(true);
		expect(patchPartSchema.safeParse({ costPrice: 999 }).success).toBe(true);
		expect(
			patchPartSchema.safeParse({ costPrice: 100, salePrice: 150 }).success
		).toBe(true);
	});

	it("rejects a sale price below the cost when both are sent", () => {
		expect(
			issuePaths(patchPartSchema, { costPrice: 100, salePrice: 50 })
		).toEqual(["salePrice"]);
	});
});

describe("adjustPartStockSchema", () => {
	it.each([5, -2])("accepts a whole delta of %i", (delta) => {
		expect(adjustPartStockSchema.safeParse({ delta }).success).toBe(true);
	});

	it.each([0, 1.5, "3", undefined])("rejects a delta of %s", (delta) => {
		expect(issuePaths(adjustPartStockSchema, { delta })).toEqual(["delta"]);
	});

	it("only reports translation keys the catalog knows", () => {
		for (const delta of [0, 1.5, undefined]) {
			const result = adjustPartStockSchema.safeParse({ delta });
			for (const issue of result.error?.issues ?? []) {
				expect(parseI18nMessage(issue.message)).not.toBe(null);
			}
		}
	});
});
