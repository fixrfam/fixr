import { employeeRoles } from "@fixr/schemas/roles";
import { describe, expect, it } from "vitest";
import { basePermissions, type EmployeeRole, roleAbilities } from "./abilities";
import { createAbility } from "./accessor";
import { type Permission, permissions } from "./permissions";

const allPermissions = Object.values(permissions).flatMap((group) =>
	Object.values(group)
) as Permission[];

const roles = Object.keys(roleAbilities) as EmployeeRole[];
const nonGuestRoles = roles.filter((role) => role !== "guest");

/**
 * The expected RBAC matrix, written out explicitly. Any change to
 * `roleAbilities` must be mirrored here on purpose: granting a permission to
 * the wrong role by accident fails loudly instead of silently shipping.
 */
const EXPECTED_ABILITIES: Record<EmployeeRole, readonly Permission[]> = {
	guest: [],
	technician: [
		...basePermissions,
		"serviceOrders:read",
		"serviceOrders:update",
		"serviceOrders:changeStatus",
		"devices:read",
	],
	warehouse: [
		...basePermissions,
		"inventory:read",
		"inventory:update",
		"devices:read",
	],
	financial: [
		...basePermissions,
		"estimates:read",
		"estimates:create",
		"estimates:update",
		"estimates:delete",
		"estimates:sendToCustomer",
		"devices:read",
	],
	manager: [
		...basePermissions,
		"serviceOrders:read",
		"serviceOrders:create",
		"serviceOrders:update",
		"serviceOrders:changeStatus",
		"serviceOrders:assign",
		"customers:create",
		"customers:update",
		"inventory:read",
		"estimates:read",
		"estimates:create",
		"estimates:update",
		"estimates:sendToCustomer",
		"employees:read",
		"employees:create",
		"devices:read",
		"devices:create",
		"devices:update",
		"devices:delete",
	],
	admin: [
		...basePermissions,
		"companies:create",
		"companies:update",
		"employees:read",
		"employees:create",
		"employees:update",
		"employees:delete",
		"serviceOrders:read",
		"serviceOrders:create",
		"serviceOrders:update",
		"serviceOrders:delete",
		"serviceOrders:changeStatus",
		"serviceOrders:assign",
		"customers:create",
		"customers:update",
		"customers:delete",
		"estimates:read",
		"estimates:create",
		"estimates:update",
		"estimates:delete",
		"estimates:sendToCustomer",
		"inventory:read",
		"inventory:create",
		"inventory:update",
		"inventory:delete",
		"inventory:adjust",
		"suppliers:read",
		"suppliers:create",
		"suppliers:update",
		"suppliers:delete",
		"parts:read",
		"parts:create",
		"parts:update",
		"parts:delete",
		"devices:read",
		"devices:create",
		"devices:update",
		"devices:delete",
	],
};

/**
 * Permissions that exist in the catalog but are intentionally not granted to
 * any role yet. Adding a permission to the catalog without assigning it (or
 * listing it here with a reason) fails the orphan check below.
 */
const UNASSIGNED_PERMISSIONS: readonly Permission[] = [
	// No role can delete its own account yet: POST /account/request-deletion requires it.
	"account:delete",
	// Audit logs are not implemented.
	"logs:read",
];

const matrix = roles.flatMap((role) =>
	allPermissions.map(
		(permission) =>
			[role, permission, EXPECTED_ABILITIES[role].includes(permission)] as const
	)
);

describe("role x permission matrix", () => {
	it.each(matrix)("%s can %s: %s", (role, permission, expected) => {
		const ability = createAbility(role);

		expect(ability.can(permission)).toBe(expected);
		expect(ability.cannot(permission)).toBe(!expected);
	});

	it("covers exactly the roles defined in @fixr/schemas", () => {
		expect([...roles].sort()).toEqual([...employeeRoles.options].sort());
	});
});

describe("guest", () => {
	it("has no permission at all", () => {
		const guest = createAbility("guest");

		for (const permission of allPermissions) {
			expect(guest.cannot(permission)).toBe(true);
		}
		expect(guest.permissions).toHaveLength(0);
	});
});

describe("createAbility", () => {
	it.each([
		["an unknown role", "superuser"],
		["undefined", undefined],
		["null", null],
		["a prototype key", "constructor"],
	])("falls back to guest for %s", (_label, role) => {
		const ability = createAbility(role as unknown as EmployeeRole);

		for (const permission of allPermissions) {
			expect(ability.can(permission)).toBe(false);
		}
		expect(ability.permissions).toEqual([]);
	});

	it("exposes the role permission list", () => {
		expect(createAbility("technician").permissions).toEqual(
			roleAbilities.technician
		);
	});
});

describe("base employee permissions", () => {
	it.each(nonGuestRoles)("are granted to %s", (role) => {
		const ability = createAbility(role);

		for (const permission of basePermissions) {
			expect(ability.can(permission)).toBe(true);
		}
	});
});

describe("scope separation", () => {
	it("technician cannot create service orders or touch employees", () => {
		const technician = createAbility("technician");

		expect(technician.cannot(permissions.serviceOrders.create)).toBe(true);
		for (const permission of Object.values(permissions.employees)) {
			expect(technician.cannot(permission)).toBe(true);
		}
	});

	it("warehouse cannot touch service orders", () => {
		const warehouse = createAbility("warehouse");

		for (const permission of Object.values(permissions.serviceOrders)) {
			expect(warehouse.cannot(permission)).toBe(true);
		}
	});

	it("financial cannot update inventory", () => {
		expect(
			createAbility("financial").cannot(permissions.inventory.update)
		).toBe(true);
	});

	it("manager cannot update or delete employees", () => {
		const manager = createAbility("manager");

		expect(manager.cannot(permissions.employees.update)).toBe(true);
		expect(manager.cannot(permissions.employees.delete)).toBe(true);
	});
});

describe("permission catalog", () => {
	it("has no orphan permission (granted to no role and not explicitly unassigned)", () => {
		const granted = new Set(Object.values(roleAbilities).flat());
		const orphans = allPermissions.filter(
			(permission) =>
				!(
					granted.has(permission) || UNASSIGNED_PERMISSIONS.includes(permission)
				)
		);

		expect(
			orphans,
			"Assign these permissions to a role or list them in UNASSIGNED_PERMISSIONS"
		).toEqual([]);
	});

	it("keeps UNASSIGNED_PERMISSIONS honest", () => {
		const granted = new Set(Object.values(roleAbilities).flat());

		for (const permission of UNASSIGNED_PERMISSIONS) {
			expect(granted.has(permission)).toBe(false);
		}
	});

	it("uses unique permission values", () => {
		expect(new Set(allPermissions).size).toBe(allPermissions.length);
	});
});
