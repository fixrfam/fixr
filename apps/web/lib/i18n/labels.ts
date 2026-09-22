import type { StaticTranslationKey } from "@fixr/i18n";
import type { employeeRoles } from "@fixr/schemas/roles";
import type { z } from "zod";

/**
 * Translation key for each employee role.
 *
 * Roles are ids on the wire, so the label lives here and the catalog holds
 * the copy. Adding a role to `@fixr/schemas` breaks this map until it is
 * translated.
 */
export const roleLabelKeys: Record<
	z.infer<typeof employeeRoles>,
	StaticTranslationKey
> = {
	guest: "roles.guest",
	admin: "roles.admin",
	manager: "roles.manager",
	financial: "roles.financial",
	warehouse: "roles.warehouse",
	technician: "roles.technician",
};
