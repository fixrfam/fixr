import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import {
	createUserSchema,
	googleCallbackSchema,
	jwtPayload,
	loginUserSchema,
	passwordSchema,
	userJWT,
	userSchema,
	verifyEmailSchema,
} from "./auth";
import { issuePaths } from "./test-utils";

const basePayload = () => ({
	id: createId(),
	email: "john@fixr.test",
	displayName: "John",
	avatarUrl: null,
	profileType: "employee" as const,
	company: {
		id: createId(),
		name: "Fixr",
		subdomain: "fixr",
		role: "manager" as const,
	},
	createdAt: new Date().toISOString(),
});

describe("passwordSchema", () => {
	it("accepts a password with upper, lower, digit and special chars", () => {
		expect(passwordSchema.safeParse("Str0ng!Pass").success).toBe(true);
	});

	it.each([
		["no uppercase", "str0ng!pass"],
		["no lowercase", "STR0NG!PASS"],
		["no digit", "Strong!Pass"],
		["no special char", "Str0ngPass1"],
		["too short", "S0!a"],
		["too long", `Aa1!${"a".repeat(130)}`],
	])("rejects a password with %s", (_label, value) => {
		expect(passwordSchema.safeParse(value).success).toBe(false);
	});

	it("rejects a missing password", () => {
		expect(passwordSchema.safeParse(undefined).success).toBe(false);
	});
});

describe("createUserSchema", () => {
	const valid = { email: "a@fixr.test", password: "Str0ng!Pass" };

	it("accepts the minimal payload", () => {
		expect(createUserSchema.safeParse(valid).success).toBe(true);
	});

	it.each(["email", "password"])("requires %s", (field) => {
		const input: Record<string, unknown> = { ...valid };
		delete input[field];

		expect(issuePaths(createUserSchema, input)).toContain(field);
	});

	it("rejects a malformed email", () => {
		expect(issuePaths(createUserSchema, { ...valid, email: "nope" })).toEqual([
			"email",
		]);
	});

	it("turns a blank displayName into undefined", () => {
		const result = createUserSchema.parse({ ...valid, displayName: "   " });

		expect(result.displayName).toBeUndefined();
	});

	it("enforces the displayName length bounds", () => {
		expect(
			issuePaths(createUserSchema, { ...valid, displayName: "Jo" })
		).toEqual(["displayName"]);
		expect(
			issuePaths(createUserSchema, { ...valid, displayName: "a".repeat(65) })
		).toEqual(["displayName"]);
	});
});

describe("loginUserSchema", () => {
	it("accepts email + password (password strength is not checked on login)", () => {
		expect(
			loginUserSchema.safeParse({ email: "a@fixr.test", password: "x" }).success
		).toBe(true);
	});

	it("rejects missing fields", () => {
		expect(issuePaths(loginUserSchema, {}).sort()).toEqual([
			"email",
			"password",
		]);
	});
});

describe("jwtPayload / userJWT", () => {
	it("accepts an employee payload with company.role", () => {
		expect(jwtPayload.safeParse(basePayload()).success).toBe(true);
	});

	it("accepts a payload without company (client accounts)", () => {
		const { company: _company, ...payload } = basePayload();

		expect(jwtPayload.safeParse(payload).success).toBe(true);
	});

	it("rejects a company without role", () => {
		const payload = basePayload();
		const { role: _role, ...company } = payload.company;

		expect(issuePaths(jwtPayload, { ...payload, company })).toEqual([
			"company.role",
		]);
	});

	it("rejects a role outside the enum", () => {
		const payload = basePayload();

		expect(
			issuePaths(jwtPayload, {
				...payload,
				company: { ...payload.company, role: "owner" },
			})
		).toEqual(["company.role"]);
	});

	// zod v4 cuid2() only enforces lowercase alphanumerics ("1" passes), so use an obviously invalid id.
	it("rejects a non-cuid2 id", () => {
		expect(
			issuePaths(jwtPayload, { ...basePayload(), id: "Not-A-Cuid" })
		).toEqual(["id"]);
	});

	it("coerces createdAt into a Date", () => {
		expect(jwtPayload.parse(basePayload()).createdAt).toBeInstanceOf(Date);
	});

	it("userJWT additionally requires iat and exp", () => {
		expect(issuePaths(userJWT, basePayload()).sort()).toEqual(["exp", "iat"]);
		expect(
			userJWT.safeParse({ ...basePayload(), iat: 1, exp: 2 }).success
		).toBe(true);
	});
});

describe("userSchema", () => {
	it("requires the passwordHash and verified flag", () => {
		const { company: _company, ...payload } = basePayload();

		expect(issuePaths(userSchema, payload).sort()).toEqual([
			"passwordHash",
			"verified",
		]);
	});
});

describe("query schemas", () => {
	it("verifyEmailSchema requires token", () => {
		expect(issuePaths(verifyEmailSchema, {})).toEqual(["token"]);
		expect(
			verifyEmailSchema.safeParse({ token: "t", redirectUrl: "/x" }).success
		).toBe(true);
	});

	it("googleCallbackSchema requires code", () => {
		expect(issuePaths(googleCallbackSchema, {})).toEqual(["code"]);
	});
});
