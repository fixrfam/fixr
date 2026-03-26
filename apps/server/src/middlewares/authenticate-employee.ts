import type { FastifyReply, FastifyRequest } from "fastify";
import { apiResponse, httpStatusCodes } from "../helpers/response";
import { queryUserById } from "../services/auth.services";
import { isFastifyError } from "./utils";

export const authenticateEmployee = async (
	req: FastifyRequest,
	res: FastifyReply
): Promise<void> => {
	try {
		await req.jwtVerify();

		const { id } = req.user;

		const user = await queryUserById(id);
		if (!user) {
			return res.status(404).send(
				apiResponse({
					status: 404,
					error: "Not Found",
					code: "user_not_found",
					message: "User not found",
					data: null,
				})
			);
		}
		if (user.profileType !== "employee") {
			return res.status(403).send(
				apiResponse({
					status: 403,
					error: "Forbidden",
					code: "not_allowed",
					message: "You are not allowed to perform this action.",
					data: null,
				})
			);
		}
	} catch (error) {
		if (isFastifyError(error)) {
			return res.status(error.statusCode!).send(
				apiResponse({
					status: error.statusCode!,
					error: httpStatusCodes[error.statusCode!],
					code: error.code,
					message: error.message,
					data: null,
				})
			);
		}
		throw error;
	}
};
