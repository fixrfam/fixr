import { permissions, roleAbilities } from "@fixr/permissions";
import { describe, expect, it } from "vitest";
import { buildPermissionMatrix, permissionCount } from "./matrix";

const matrix = buildPermissionMatrix();
const rows = matrix.flatMap((group) => group.rows);

describe("buildPermissionMatrix", () => {
	it("lists every permission of the catalog once", () => {
		const all = Object.values(permissions).flatMap((group) =>
			Object.values(group)
		);

		expect(rows.map((row) => row.permission).sort()).toEqual([...all].sort());
	});

	it("keeps the catalog order of resources", () => {
		expect(matrix.map((group) => group.resource)).toEqual(
			Object.keys(permissions)
		);
	});

	it("marks exactly the roles that hold each permission", () => {
		for (const row of rows) {
			for (const [role, granted] of Object.entries(roleAbilities)) {
				expect(
					row.roles.includes(role as never),
					`${role} ${row.permission}`
				).toBe(granted.includes(row.permission));
			}
		}
	});

	it("shows that only admin deletes parts", () => {
		const row = rows.find((r) => r.permission === permissions.parts.delete);

		expect(row?.roles).toEqual(["admin"]);
	});
});

describe("permissionCount", () => {
	it("counts each permission once", () => {
		expect(permissionCount("guest")).toBe(0);
		expect(permissionCount("admin")).toBe(new Set(roleAbilities.admin).size);
	});
});
