import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { hashPassword } from "./hash-password";

describe("hashPassword", () => {
	it("produces a bcrypt hash that verifies only the original password", async () => {
		const hash = await hashPassword("Str0ng!Pass");

		expect(hash).not.toBe("Str0ng!Pass");
		expect(hash.startsWith("$2")).toBe(true);
		expect(await bcrypt.compare("Str0ng!Pass", hash)).toBe(true);
		expect(await bcrypt.compare("wrong", hash)).toBe(false);
	});

	it("salts every hash", async () => {
		const [a, b] = await Promise.all([hashPassword("x"), hashPassword("x")]);

		expect(a).not.toBe(b);
	});
});
