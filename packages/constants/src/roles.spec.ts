import { employeeRoles } from "@fixr/schemas/roles";
import { describe, expect, it } from "vitest";
import { roleLabels } from "./roles";

describe("roleLabels", () => {
	it("has a label for every employee role", () => {
		expect(Object.keys(roleLabels).sort()).toEqual(
			[...employeeRoles.options].sort()
		);
	});
});
