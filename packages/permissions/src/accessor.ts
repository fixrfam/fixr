import { type EmployeeRole, roleAbilities } from "./abilities";
import type { Permission } from "./permissions";

export interface Ability {
	can: (permission: Permission) => boolean;
	cannot: (permission: Permission) => boolean;
	permissions: readonly string[];
}

export function createAbility(role: EmployeeRole): Ability {
	const perms = roleAbilities[role];
	return {
		can: (permission) => perms.includes(permission),
		cannot: (permission) => !perms.includes(permission),
		permissions: perms as readonly string[],
	};
}
