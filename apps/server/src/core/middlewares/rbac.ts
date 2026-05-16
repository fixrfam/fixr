import { createAbility } from "@fixr/permissions";
import type { Permission } from "@fixr/permissions/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import type { Context } from "elysia";
import type { z } from "zod";
import { apiResponse } from "../lib/response";

export function requirePermission(permission: Permission) {
	return (ctx: Context) => {
		const user = (ctx as Context & { user: object }).user as
			| z.infer<typeof userJWT>
			| undefined;
		const role = user?.company?.role ?? "guest";
		const ability = createAbility(role);

		if (ability.cannot(permission)) {
			ctx.set.status = 403;
			return apiResponse({
				status: 403,
				error: "Forbidden",
				code: "missing_required_permissions",
				message:
					"You dont have the required permissions to perform this action",
				data: null,
			});
		}
	};
}
