import { passwordSchema } from "@fixr/schemas/auth";
import { describe, expect, it } from "vitest";
import { apiResponse, cn, generateRandomPassword, tryCatch } from "./utils";

describe("admin lib/utils", () => {
	it("cn merges Tailwind classes", () => {
		expect(cn("px-2", "px-4", false)).toBe("px-4");
	});

	it("tryCatch wraps success and failure", async () => {
		expect(await tryCatch(Promise.resolve(1))).toEqual({
			data: 1,
			error: null,
		});
		expect(await tryCatch(Promise.reject("x"))).toEqual({
			data: null,
			error: "x",
		});
	});

	it("apiResponse builds the API envelope", () => {
		expect(
			apiResponse({
				status: 200,
				error: null,
				code: "ok",
				message: "ok",
				data: [1],
			})
		).toEqual({
			status: 200,
			error: null,
			code: "ok",
			message: "ok",
			data: [1],
		});
	});

	it("generateRandomPassword satisfies the API password policy (default 16 chars)", () => {
		for (let i = 0; i < 100; i++) {
			const password = generateRandomPassword();
			expect(password).toHaveLength(16);
			expect(passwordSchema.safeParse(password).success).toBe(true);
		}
		expect(generateRandomPassword(30)).toHaveLength(30);
	});
});
