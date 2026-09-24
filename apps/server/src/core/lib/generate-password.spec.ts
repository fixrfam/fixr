import { passwordSchema } from "@fixr/schemas/auth";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateRandomPassword } from "./generate-password";

describe("generateRandomPassword", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("defaults to 12 characters", () => {
		expect(generateRandomPassword()).toHaveLength(12);
	});

	it.each([8, 16, 128])("honours length %i", (length) => {
		expect(generateRandomPassword(length)).toHaveLength(length);
	});

	it.each([7, 129])("rejects length %i", (length) => {
		expect(() => generateRandomPassword(length)).toThrow();
	});

	it("always satisfies the API password policy", () => {
		for (let i = 0; i < 200; i++) {
			expect(passwordSchema.safeParse(generateRandomPassword()).success).toBe(
				true
			);
		}
	});

	it("contains every required class even with a fixed random source", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);

		const password = generateRandomPassword(8);

		expect(password).toMatch(/[A-Z]/);
		expect(password).toMatch(/[a-z]/);
		expect(password).toMatch(/[0-9]/);
		expect(password).toMatch(/[#?!@$%^&*-]/);
	});

	it("does not repeat values across calls", () => {
		const passwords = new Set(
			Array.from({ length: 100 }, () => generateRandomPassword())
		);

		expect(passwords.size).toBe(100);
	});
});
