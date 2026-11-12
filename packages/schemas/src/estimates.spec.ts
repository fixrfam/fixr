import { parseI18nMessage } from "@fixr/i18n";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import {
	createEstimateSchema,
	estimateIdParamsSchema,
	getEstimatesQuerySchema,
	patchEstimateSchema,
	updateEstimateStatusSchema,
} from "./estimates";
import { issuePaths } from "./test-utils";

describe("createEstimateSchema", () => {
	it("needs only the service order", () => {
		expect(
			createEstimateSchema.safeParse({ serviceOrderId: createId() }).success
		).toBe(true);
	});

	it("coerces the validity date", () => {
		const result = createEstimateSchema.parse({
			serviceOrderId: createId(),
			validUntil: "2026-12-31",
			discountPercentage: 12.5,
		});

		expect(result.validUntil).toBeInstanceOf(Date);
	});

	it.each([
		[{ discountPercentage: -1 }, "discountPercentage"],
		[{ discountPercentage: 101 }, "discountPercentage"],
		[{ notes: "x".repeat(1001) }, "notes"],
		[{ serviceOrderId: "Not-A-Cuid!" }, "serviceOrderId"],
	])("rejects %o", (input, path) => {
		expect(
			issuePaths(createEstimateSchema, { serviceOrderId: createId(), ...input })
		).toEqual([path]);
	});

	it("only reports translation keys the catalog knows", () => {
		const result = createEstimateSchema.safeParse({
			serviceOrderId: "x",
			discountPercentage: "x",
			notes: "x".repeat(1001),
		});

		for (const issue of result.error?.issues ?? []) {
			expect(parseI18nMessage(issue.message), issue.path.join(".")).not.toBe(
				null
			);
		}
	});
});

describe("patchEstimateSchema", () => {
	it("accepts an empty patch and clearing the notes", () => {
		expect(patchEstimateSchema.safeParse({}).success).toBe(true);
		expect(patchEstimateSchema.safeParse({ notes: null }).success).toBe(true);
	});
});

describe("updateEstimateStatusSchema", () => {
	it("accepts only known statuses", () => {
		expect(
			updateEstimateStatusSchema.safeParse({ status: "sent" }).success
		).toBe(true);
		expect(
			updateEstimateStatusSchema.safeParse({ status: "paid" }).success
		).toBe(false);
	});
});

describe("getEstimatesQuerySchema", () => {
	it("filters by status and service order", () => {
		const serviceOrderId = createId();

		expect(
			getEstimatesQuerySchema.parse({
				page: "2",
				status: "approved",
				serviceOrderId,
			})
		).toMatchObject({ page: 2, status: "approved", serviceOrderId });
	});
});

describe("estimateIdParamsSchema", () => {
	it("requires a cuid", () => {
		expect(
			estimateIdParamsSchema.safeParse({ estimateId: "Not-A-Cuid!" }).success
		).toBe(false);
	});
});
