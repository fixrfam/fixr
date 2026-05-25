import { verifyToken } from "@clerk/backend";
import { env } from "@fixr/env/server";
import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../lib/app-error";

export async function authenticateAdmin(
	req: FastifyRequest,
	_res: FastifyReply
): Promise<void> {
	const authHeader = req.headers.authorization;

	if (!authHeader?.startsWith("Bearer ")) {
		throw new AppError("AUTH_JWT_INVALID");
	}

	const token = authHeader.slice(7);

	try {
		await verifyToken(token, {
			secretKey: env.CLERK_SECRET_KEY,
		});
	} catch (error) {
		if (error instanceof AppError) {
			throw error;
		}
		throw new AppError("AUTH_JWT_INVALID");
	}
}
