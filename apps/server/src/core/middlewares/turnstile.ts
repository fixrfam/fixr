import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../lib/app-error";
import { verifyTurnstileToken } from "../lib/turnstile";

export function requireTurnstile(fieldName = "cfTurnstileToken") {
	return async (req: FastifyRequest, _res: FastifyReply) => {
		const body = req.body as Record<string, unknown> | undefined;
		const token = body?.[fieldName] as string | undefined;

		if (!token) {
			throw new AppError("TURNSTILE_VALIDATION_FAILED");
		}

		await verifyTurnstileToken(token, req.ip);
	};
}
