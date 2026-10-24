import { cookieKey } from "@fixr/constants/cookies";
import type { FastifyReply, FastifyRequest } from "fastify";
import {
	type PortalIdentity,
	PortalRepository,
} from "../../modules/portal/repositories";
import { AppError } from "../lib/app-error";
import { hashOpaqueToken } from "../lib/opaque-token";

declare module "fastify" {
	interface FastifyRequest {
		/** Present only on client portal routes, after `authenticatePortal`. */
		portal?: PortalIdentity & { sessionId: string };
	}
}

export const PORTAL_SESSION_COOKIE = cookieKey("portalSession");

/**
 * Client portal session (opened from an emailed link). It is a separate
 * opaque cookie, never a JWT, so it can't be mistaken for an employee session.
 */
export const authenticatePortal = async (
	req: FastifyRequest,
	_res: FastifyReply
): Promise<void> => {
	const token = req.cookies[PORTAL_SESSION_COOKIE];
	if (!token) {
		throw new AppError("PORTAL_UNAUTHORIZED");
	}

	const session = await PortalRepository.queryActiveSession(
		hashOpaqueToken(token)
	);
	if (!session) {
		throw new AppError("PORTAL_UNAUTHORIZED");
	}

	req.portal = {
		sessionId: session.id,
		cpf: session.cpf,
		email: session.email,
		clientId: session.clientId,
	};
};
