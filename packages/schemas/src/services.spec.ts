import { parseI18nMessage } from "@fixr/i18n";
import { describe, expect, it } from "vitest";
import { createServiceSchema } from "./services";
import { issuePaths } from "./test-utils";

const validService = {
	name: "Screen replacement",
	description: "Swap a broken display for a new one.",
	estimatedDurationMinutes: 90,
	price: 250,
	partIds: ["part_1"],
	deviceCategories: ["smartphone"],
	testInstructions: ["Check touch on every corner"],
	testParameters: ["Brightness at 100%"],
};

describe("createServiceSchema", () => {
	it("accepts a valid service", () => {
		expect(createServiceSchema.safeParse(validService).success).toBe(true);
	});

	it("accepts a service with no parts and no test topics", () => {
		expect(
			createServiceSchema.safeParse({
				...validService,
				partIds: [],
				testInstructions: [],
				testParameters: [],
			}).success
		).toBe(true);
	});

	it.each(["name", "description"])("rejects an empty %s", (field) => {
		expect(
			issuePaths(createServiceSchema, { ...validService, [field]: "" })
		).toEqual([field]);
	});

	it.each([
		["name", 121],
		["description", 501],
	])("limits %s to %i characters", (field, length) => {
		expect(
			issuePaths(createServiceSchema, {
				...validService,
				[field]: "x".repeat(length),
			})
		).toEqual([field]);
	});

	it.each([
		0, -5, 1.5,
	])("rejects an estimated duration of %d minutes", (minutes) => {
		expect(
			issuePaths(createServiceSchema, {
				...validService,
				estimatedDurationMinutes: minutes,
			})
		).toEqual(["estimatedDurationMinutes"]);
	});

	it("rejects a negative price but allows a free service", () => {
		expect(
			issuePaths(createServiceSchema, { ...validService, price: -1 })
		).toEqual(["price"]);
		expect(
			createServiceSchema.safeParse({ ...validService, price: 0 }).success
		).toBe(true);
	});

	it("requires at least one device category", () => {
		expect(
			issuePaths(createServiceSchema, {
				...validService,
				deviceCategories: [],
			})
		).toEqual(["deviceCategories"]);
	});

	it.each([
		"testInstructions",
		"testParameters",
	])("validates each topic in %s", (field) => {
		expect(
			issuePaths(createServiceSchema, {
				...validService,
				[field]: ["ok", "", "x".repeat(201)],
			})
		).toEqual([`${field}.1`, `${field}.2`]);
	});

	it("only reports translation keys the catalog knows", () => {
		const result = createServiceSchema.safeParse({
			...validService,
			name: "",
			description: "x".repeat(501),
			estimatedDurationMinutes: 0.5,
			price: "free",
			deviceCategories: [],
			testInstructions: ["x".repeat(201)],
		});

		expect(result.success).toBe(false);
		for (const issue of result.error?.issues ?? []) {
			expect(parseI18nMessage(issue.message), issue.path.join(".")).not.toBe(
				null
			);
		}
	});

	// Known gap: an empty topic has no i18n key, so the raw zod message reaches the UI.
	it("currently reports an empty topic with zod's default message", () => {
		const result = createServiceSchema.safeParse({
			...validService,
			testInstructions: [""],
		});

		expect(parseI18nMessage(result.error?.issues[0]?.message ?? "")).toBeNull();
	});
});
