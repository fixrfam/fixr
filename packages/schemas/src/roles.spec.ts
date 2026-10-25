import { roleAbilities } from "@fixr/permissions";
import { describe, expect, it } from "vitest";
import { employeeRoles } from "./roles";

describe("employeeRoles", () => {
	it.each(employeeRoles.options)("accepts %s", (role) => {
		expect(employeeRoles.safeParse(role).success).toBe(true);
	});

	it.each(["owner", "ADMIN", "", undefined])("rejects %s", (role) => {
		expect(employeeRoles.safeParse(role).success).toBe(false);
	});

	it("matches the roles that have abilities in @fixr/permissions", () => {
		expect([...employeeRoles.options].sort()).toEqual(
			Object.keys(roleAbilities).sort()
		);
	});
});
