import { createAbility } from "@fixr/permissions";
import type { Permission } from "@fixr/permissions/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { z } from "zod";
import { AppError } from "../lib/app-error";

declare module "fastify" {
	interface FastifyRequest {
		ability: ReturnType<typeof createAbility>;
	}
}

const abilities = new WeakMap<FastifyRequest, ReturnType<typeof createAbility>>();

export function setupRBAC(fastify: FastifyInstance) {
	fastify.decorateRequest("ability", {
		getter() {
			return abilities.get(this) ?? createAbility("guest");
		},
		setter(val) {
			abilities.set(this, val);
		},
	});

	fastify.addHook("onRequest", (request, _reply, done) => {
		const user = request.user as z.infer<typeof userJWT> | undefined;
		const role = user?.company?.role ?? "guest";
		request.ability = createAbility(role);
		done();
	});
}

export function requirePermission(permission: Permission) {
	return (
		request: FastifyRequest,
		_reply: FastifyReply,
		done: (err?: Error) => void,
	): void => {
		if (request.ability.cannot(permission)) {
			done(new AppError("MISSING_PERMISSIONS"));
			return;
		}
		done();
	};
}
