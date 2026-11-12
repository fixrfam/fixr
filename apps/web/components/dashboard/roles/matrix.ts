import {
	createAbility,
	type EmployeeRole,
	type Permission,
	permissions,
	roleAbilities,
} from "@fixr/permissions";

/** Every role, from least to most access. */
export const MATRIX_ROLES = [
	"guest",
	"technician",
	"warehouse",
	"financial",
	"manager",
	"admin",
] as const satisfies readonly EmployeeRole[];

/** Roles shown as columns. Guest has no permissions, so it only gets a card. */
export const COLUMN_ROLES = MATRIX_ROLES.filter((role) => role !== "guest");

export interface MatrixRow {
	permission: Permission;
	action: string;
	/** Roles that hold this permission. */
	roles: EmployeeRole[];
}

export interface MatrixGroup {
	resource: string;
	rows: MatrixRow[];
}

/**
 * The default RBAC matrix, read straight from `@fixr/permissions`, so the page
 * can't drift from what the API enforces. Groups keep the catalog order.
 */
export function buildPermissionMatrix(): MatrixGroup[] {
	const abilities = Object.fromEntries(
		MATRIX_ROLES.map((role) => [role, createAbility(role)])
	) as Record<EmployeeRole, ReturnType<typeof createAbility>>;

	return Object.entries(permissions).map(([resource, actions]) => ({
		resource,
		rows: Object.entries(actions).map(([action, permission]) => ({
			permission: permission as Permission,
			action,
			roles: MATRIX_ROLES.filter((role) =>
				abilities[role].can(permission as Permission)
			),
		})),
	}));
}

/** How many permissions a role holds. */
export function permissionCount(role: EmployeeRole): number {
	return new Set(roleAbilities[role]).size;
}
