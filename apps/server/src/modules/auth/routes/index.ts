import { cookieKey } from "@fixr/constants/cookies";
import {
	createUserSchema,
	googleCallbackSchema,
	loginUserSchema,
	verifyEmailSchema,
} from "@fixr/schemas/auth";
import type { FastifyRequest } from "fastify";
import { authDocs } from "../../../core/docs/auth.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { requireTurnstile } from "../../../core/middlewares/turnstile";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { AuthController } from "../controllers";

/** @description Auth routes plugin */
export function authRoutes(fastify: FastifyTypedInstance) {
	fastify.post(
		"/register",
		{
			schema: authDocs.registerSchema,
			preHandler: [requireTurnstile()],
		},
		withErrorHandler(async (request, response) => {
			await createUserSchema.parseAsync(request.body);

			return response.status(500).send({
				status: 501,
				error: "Not implemented",
				code: "not_implemented",
				message: "This endpoint is not implemented or disabled.",
				data: null,
			});
		})
	);

	fastify.post(
		"/login",
		{ schema: authDocs.loginSchema, preHandler: [requireTurnstile()] },
		withErrorHandler(async (request, response) => {
			const body = await loginUserSchema.parseAsync(request.body);

			await AuthController.login({ body, response });
		})
	);

	fastify.get(
		"/verify",
		{ schema: authDocs.verifySchema },
		withErrorHandler(
			async (
				request: FastifyRequest<{
					Querystring: { token: string; redirectUrl?: string };
				}>,
				response
			) => {
				const query = await verifyEmailSchema.parseAsync(request.query);
				const token = decodeURIComponent(query.token);

				await AuthController.verify({
					token,
					redirectUrl: query.redirectUrl,
					response,
				});
			}
		)
	);

	fastify.get(
		"/signout",
		{ schema: authDocs.signOutSchema },
		withErrorHandler(async (request, response) => {
			const refreshToken = request.cookies[cookieKey("refreshToken")];

			await AuthController.signOut({ refreshToken, response });
		})
	);

	fastify.post(
		"/token",
		{ schema: authDocs.revalidateSchema },
		withErrorHandler(async (request, response) => {
			const refreshToken = request.cookies[cookieKey("refreshToken")];

			await AuthController.revalidate({ refreshToken, response });
		})
	);

	fastify.get(
		"/google",
		{ schema: authDocs.googleLoginSchema },
		withErrorHandler(async (request, response) => {
			await AuthController.googleLogin({ request, response });
		})
	);

	fastify.get(
		"/google/callback",
		{ schema: authDocs.googleCallbackSchema },
		withErrorHandler(
			async (
				request: FastifyRequest<{ Querystring: { code: string } }>,
				response
			) => {
				const { code } = await googleCallbackSchema.parseAsync(request.query);
				await AuthController.googleCallback({ response, code });
			}
		)
	);
}
