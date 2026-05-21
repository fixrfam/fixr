import type { userJWT } from "@fixr/schemas/auth";
import {
	changePasswordAuthenticatedSchema as changePasswordBodySchema,
	confirmPasswordResetSchema,
	requestPasswordResetSchema,
} from "@fixr/schemas/credentials";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { credentialDocs } from "../../../core/docs/credentials.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticate } from "../../../core/middlewares/authenticate";
import { requireTurnstile } from "../../../core/middlewares/turnstile";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { CredentialsController } from "../controllers";

/** @description Credentials routes plugin */
export function credentialsRoutes(fastify: FastifyTypedInstance) {
	fastify.put(
		"/password",
		{
			preHandler: authenticate,
			schema: credentialDocs.changePasswordAuthenticatedSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const body = changePasswordBodySchema.parse(request.body);

			await CredentialsController.changePasswordAuthenticated({
				user: userJwt,
				body,
				response,
			});
		})
	);

	fastify.post(
		"/password/reset",
		{
			schema: credentialDocs.requestPasswordResetSchema,
			preHandler: [requireTurnstile()],
		},
		withErrorHandler(async (request, response) => {
			const body = requestPasswordResetSchema.parse(request.body);
			await CredentialsController.requestPasswordReset({
				email: body.email,
				response,
			});
		})
	);

	fastify.put(
		"/password/reset",
		{
			schema: credentialDocs.confirmPasswordResetSchema,
			preHandler: [requireTurnstile()],
		},
		withErrorHandler(async (request, response) => {
			const body = confirmPasswordResetSchema.parse(request.body);
			await CredentialsController.confirmPasswordReset({ body, response });
		})
	);

	fastify.get(
		"/password/reset",
		{ schema: credentialDocs.validatePasswordResetTokenSchema },
		withErrorHandler(
			async (
				request: FastifyRequest<{ Querystring: { token: string } }>,
				response
			) => {
				const query = await z
					.object({ token: z.string() })
					.parseAsync(request.query);
				const token = decodeURIComponent(query.token);

				await CredentialsController.validatePasswordResetToken({
					token,
					response,
				});
			}
		)
	);
}
