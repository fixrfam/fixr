import { env } from "@fixr/env/server";
import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../lib/app-error";
import { sendErrorResponse } from "../lib/response";

function errorResponseData(err: unknown) {
	const data: Record<string, unknown> = {};
	if (err instanceof Error) {
		data.message = err.message;
		// Stack traces help locally but must not leak to API clients in production.
		if (err.stack && env.NODE_ENV !== "production") {
			data.stack = err.stack.split("\n").slice(0, 4).join("\n");
		}
	} else if (err && typeof err === "object") {
		data.details = String(err);
	}
	return data;
}

export function withErrorHandler<
	TRequest extends FastifyRequest = FastifyRequest,
>(handler: (req: TRequest, res: FastifyReply) => Promise<void>) {
	return async (req: TRequest, res: FastifyReply) => {
		if (res.sent) {
			return;
		}

		try {
			await handler(req, res);
		} catch (err) {
			if (err instanceof AppError) {
				return err.send(res);
			}

			if (res.sent) {
				return;
			}

			req.log.error(err, "Unexpected error in route handler");

			return sendErrorResponse(res, {
				status: 500,
				error: "Internal Server Error",
				code: "internal_error",
				message: err instanceof Error ? err.message : "Something went wrong.",
				data: errorResponseData(err),
			});
		}
	};
}
