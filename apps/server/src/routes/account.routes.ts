import { confirmAccountDeletionSchema } from "@fixr/schemas/account";
import type { userJWT } from "@fixr/schemas/auth";
import type { FastifyRequest } from "fastify";
import type { z } from "zod";
import { getAccountHandler } from "../controllers/account/account-handler";
import {
	confirmAccountDeletionHandler,
	requestAccountDeletionHandler,
} from "../controllers/account/delete-handler";
import { accountDocs } from "../docs/account.docs";
import type { FastifyTypedInstance } from "../interfaces/fastify";
import { authenticate } from "../middlewares/authenticate";
import { withErrorHandler } from "../middlewares/with-error-handler";

export function accountRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{ preHandler: authenticate, schema: accountDocs.getAccountSchema },
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;

			await getAccountHandler({ userId: userJwt.id, response });
		})
	);

	fastify.post(
		"/request-deletion",
		{ preHandler: authenticate, schema: accountDocs.requestDeletionSchema },
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;

			await requestAccountDeletionHandler({
				userId: userJwt.id,
				request,
				response,
			});
		})
	);

	fastify.get(
		"/confirm-deletion",
		{ schema: accountDocs.confirmDeletionSchema },
		withErrorHandler(
			async (
				request: FastifyRequest<{
					Querystring: { token: string; redirectUrl?: string };
				}>,
				response
			) => {
				const query = await confirmAccountDeletionSchema.parseAsync(
					request.query
				);
				const token = decodeURIComponent(query.token);

				await confirmAccountDeletionHandler({
					token,
					redirectUrl: query.redirectUrl,
					response,
				});
			}
		)
	);
}
