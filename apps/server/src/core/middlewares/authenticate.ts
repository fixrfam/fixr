import { createAbility } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { z } from "zod";
import { AuthRepository } from "../../modules/auth/repositories";
import { AppError } from "../lib/app-error";
import { isFastifyError } from "./utils";

export const authenticate = async (
	req: FastifyRequest,
	_res: FastifyReply
): Promise<void> => {
	try {
		await req.jwtVerify();

		const { id } = req.user;

		const user = await AuthRepository.queryUserById(id);
		if (!user) {
			throw new AppError("RESOURCE_NOT_FOUND");
		}

		const jwt = req.user as z.infer<typeof userJWT>;
		const role = jwt.company?.role ?? "guest";
		req.ability = createAbility(role);
	} catch (error) {
		if (isFastifyError(error)) {
			throw new AppError("AUTH_JWT_INVALID");
		}
		throw error;
	}
};
