import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../lib/app-error";
import { apiResponse } from "../lib/response";

export function withErrorHandler<
	TRequest extends FastifyRequest = FastifyRequest,
>(handler: (req: TRequest, res: FastifyReply) => Promise<void>) {
	return async (req: TRequest, res: FastifyReply) => {
		try {
			await handler(req, res);
		} catch (err) {
			if (err instanceof AppError) {
				return err.send(res);
			}

			console.error("Unexpected error:", err);

			return res.status(500).send(
				apiResponse({
					status: 500,
					error: "Internal Server Error",
					code: "internal_error",
					message: "Something went wrong.",
					data: err,
				})
			);
		}
	};
}
