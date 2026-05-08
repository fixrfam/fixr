import { createAbility } from "@fixr/permissions";
import type { Permission } from "@fixr/permissions/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type { z } from "zod";
import { apiResponse } from "../helpers/response";

declare module "fastify" {
	interface FastifyRequest {
		ability: ReturnType<typeof createAbility>;
	}
}

// biome-ignore lint/suspicious/useAwait: <We need to make this plugin async so it doesnt block IO, despite having no await expression>
export const rbacPlugin: FastifyPluginAsync = async (fastify) => {
	fastify.decorateRequest("ability", { getter: () => createAbility("guest") });

	fastify.addHook("onRequest", (request, _reply, done) => {
		const user = request.user as z.infer<typeof userJWT> | undefined;
		const role = user?.company?.role ?? "guest";
		request.ability = createAbility(role);
		done();
	});
};

export function requirePermission(permission: Permission) {
	return (request: FastifyRequest, reply: FastifyReply): void => {
		if (request.ability.cannot(permission)) {
			reply.status(403).send(
				apiResponse({
					status: 403,
					error: "Forbidden",
					code: "missing_required_permissions",
					message:
						"You dont have the required permissions to perform this action",
					data: null,
				})
			);
		}
	};
}
