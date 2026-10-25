import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { accountSchema, confirmAccountDeletionSchema } from "./account";
import { issuePaths } from "./test-utils";

const validAccount = () => ({
	id: createId(),
	email: "a@fixr.test",
	avatarUrl: null,
	displayName: null,
	cpf: "52998224725",
	profileType: "client",
	createdAt: "2024-01-01T00:00:00.000Z",
});

describe("accountSchema", () => {
	it("accepts a client account", () => {
		expect(accountSchema.safeParse(validAccount()).success).toBe(true);
	});

	it.each([
		"id",
		"email",
		"cpf",
		"profileType",
		"createdAt",
	])("requires %s", (field) => {
		const input: Record<string, unknown> = validAccount();
		delete input[field];

		expect(issuePaths(accountSchema, input)).toContain(field);
	});

	it("requires phone to have exactly 11 digits when present", () => {
		expect(
			issuePaths(accountSchema, { ...validAccount(), phone: "123" })
		).toEqual(["phone"]);
		expect(
			accountSchema.safeParse({ ...validAccount(), phone: "11999998888" })
				.success
		).toBe(true);
	});

	it("rejects an unknown profileType", () => {
		expect(
			issuePaths(accountSchema, { ...validAccount(), profileType: "admin" })
		).toEqual(["profileType"]);
	});
});

describe("confirmAccountDeletionSchema", () => {
	it("requires the token", () => {
		expect(issuePaths(confirmAccountDeletionSchema, {})).toEqual(["token"]);
	});
});
