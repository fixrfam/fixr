import type { FastifyReply, FastifyRequest } from "fastify";
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
	} catch (error) {
		if (isFastifyError(error)) {
			throw new AppError("AUTH_JWT_INVALID");
		}
		throw error;
	}
};
