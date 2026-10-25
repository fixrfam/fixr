import { passwordSchema } from "@fixr/schemas/auth";
import { describe, expect, it } from "vitest";
import { PASSWORD_RESTRICTION_REGEXES } from "./enforcements";

describe("PASSWORD_RESTRICTION_REGEXES", () => {
	it("accepts every class required by passwordSchema", () => {
		const password = "Str0ng!Pass";

		for (const regex of Object.values(PASSWORD_RESTRICTION_REGEXES)) {
			expect(regex.test(password)).toBe(true);
		}
		expect(passwordSchema.safeParse(password).success).toBe(true);
	});

	it.each([
		["uppercase", "str0ng!pass"],
		["lowercase", "STR0NG!PASS"],
		["number", "Strong!Pass"],
		["special", "Str0ngPass"],
	] as const)("detects a missing %s character", (rule, password) => {
		expect(PASSWORD_RESTRICTION_REGEXES[rule].test(password)).toBe(false);
	});
});
