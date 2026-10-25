import { describe, expect, it } from "vitest";
import { createEmployeeSchema } from "./employees";
import { issuePaths } from "./test-utils";

const validEmployee = {
	name: "João Técnico",
	cpf: "52998224725",
	role: "technician",
	email: "joao@fixr.test",
};

describe("createEmployeeSchema", () => {
	it("accepts an employee without phone and password", () => {
		expect(createEmployeeSchema.safeParse(validEmployee).success).toBe(true);
	});

	it.each(["name", "cpf", "role", "email"])("requires %s", (field) => {
		const input: Record<string, unknown> = { ...validEmployee };
		delete input[field];

		expect(issuePaths(createEmployeeSchema, input)).toContain(field);
	});

	it("only accepts roles from employeeRoles", () => {
		expect(
			issuePaths(createEmployeeSchema, { ...validEmployee, role: "owner" })
		).toEqual(["role"]);
	});

	it("requires an 11-digit phone when present", () => {
		expect(
			issuePaths(createEmployeeSchema, { ...validEmployee, phone: "1199" })
		).toEqual(["phone"]);
	});

	it("validates the optional password strength", () => {
		expect(
			issuePaths(createEmployeeSchema, { ...validEmployee, password: "weak" })
		).toContain("password");
	});

	it("enforces the name length bounds", () => {
		expect(
			issuePaths(createEmployeeSchema, { ...validEmployee, name: "Jo" })
		).toEqual(["name"]);
		expect(
			issuePaths(createEmployeeSchema, {
				...validEmployee,
				name: "a".repeat(101),
			})
		).toEqual(["name"]);
	});
});
