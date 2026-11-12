import { parseI18nMessage } from "@fixr/i18n";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import {
	portalEstimateParamsSchema,
	portalServiceOrderParamsSchema,
	portalTokenSchema,
	requestPortalAccessSchema,
} from "./portal";
import { issuePaths } from "./test-utils";

describe("requestPortalAccessSchema", () => {
	it("trims the email and keeps the Turnstile token optional", () => {
		expect(
			requestPortalAccessSchema.parse({ email: " maria@fixr.test " })
		).toEqual({ email: "maria@fixr.test" });
	});

	it.each([
		"",
		"maria",
		`${"a".repeat(250)}@fixr.test`,
	])("rejects %j", (email) => {
		expect(issuePaths(requestPortalAccessSchema, { email })).toContain("email");
	});

	it("only reports translation keys the catalog knows", () => {
		const result = requestPortalAccessSchema.safeParse({ email: "" });

		for (const issue of result.error?.issues ?? []) {
			expect(parseI18nMessage(issue.message)).not.toBe(null);
		}
	});
});

describe("portalTokenSchema", () => {
	it("accepts a link token and refuses short or huge values", () => {
		expect(portalTokenSchema.safeParse({ token: "t".repeat(43) }).success).toBe(
			true
		);
		expect(portalTokenSchema.safeParse({ token: "short" }).success).toBe(false);
		expect(portalTokenSchema.safeParse({ token: "t".repeat(65) }).success).toBe(
			false
		);
	});
});

describe("portal params", () => {
	it("require cuids", () => {
		expect(
			portalServiceOrderParamsSchema.safeParse({ serviceOrderId: createId() })
				.success
		).toBe(true);
		expect(
			portalEstimateParamsSchema.safeParse({ estimateId: "Not-A-Cuid!" })
				.success
		).toBe(false);
	});
});
