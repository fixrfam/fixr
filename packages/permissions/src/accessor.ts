import { type EmployeeRole, roleAbilities } from "./abilities";
import type { Permission } from "./permissions";

export interface Ability {
	can: (permission: Permission) => boolean;
	cannot: (permission: Permission) => boolean;
	permissions: readonly string[];
}

export function createAbility(role: EmployeeRole): Ability {
	// Fail closed: an unknown/missing role (e.g. a malformed JWT) gets no permissions.
	const perms = Object.keys(roleAbilities).includes(role)
		? roleAbilities[role]
		: roleAbilities.guest;
	return {
		can: (permission) => perms.includes(permission),
		cannot: (permission) => !perms.includes(permission),
		permissions: perms as readonly string[],
	};
}
