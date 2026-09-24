import { describe, expect, it } from "vitest";
import {
	changePasswordAuthenticatedSchema,
	confirmPasswordResetSchema,
	requestPasswordResetSchema,
} from "./credentials";
import { issuePaths } from "./test-utils";

describe("changePasswordAuthenticatedSchema", () => {
	it("requires the old password and a strong new one", () => {
		expect(
			changePasswordAuthenticatedSchema.safeParse({
				old: "anything",
				new: "Str0ng!Pass",
			}).success
		).toBe(true);
		expect(
			issuePaths(changePasswordAuthenticatedSchema, { old: "x", new: "weak" })
		).toContain("new");
		expect(
			issuePaths(changePasswordAuthenticatedSchema, { new: "Str0ng!Pass" })
		).toEqual(["old"]);
	});
});

describe("requestPasswordResetSchema", () => {
	it("requires a valid email", () => {
		expect(issuePaths(requestPasswordResetSchema, { email: "x" })).toEqual([
			"email",
		]);
		expect(
			requestPasswordResetSchema.safeParse({ email: "a@fixr.test" }).success
		).toBe(true);
	});
});

describe("confirmPasswordResetSchema", () => {
	it("requires the token and a strong password", () => {
		expect(issuePaths(confirmPasswordResetSchema, {}).sort()).toEqual([
			"password",
			"token",
		]);
		expect(
			confirmPasswordResetSchema.safeParse({
				token: "t",
				password: "Str0ng!Pass",
			}).success
		).toBe(true);
	});
});
