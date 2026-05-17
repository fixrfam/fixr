import type { userJWT } from "@fixr/schemas/auth";
import {
	changePasswordAuthenticatedSchema as changePasswordBodySchema,
	confirmPasswordResetSchema,
	requestPasswordResetSchema,
} from "@fixr/schemas/credentials";
import type { Context } from "elysia";
import { z } from "zod";
import { credentialDocs } from "../../../core/docs/credentials.docs";
import { authenticate } from "../../../core/middlewares/authenticate";
import { CredentialsController } from "../controllers";

/** @description Credentials routes plugin */
export function credentialsRoutes(app: Elysia) {
	return app
		.put(
			"/credentials/password",
			(ctx: Context) => {
				const body = changePasswordBodySchema.parse(ctx.body);
				const user = (ctx as Context & { user: z.infer<typeof userJWT> }).user;
				return CredentialsController.changePasswordAuthenticated({
					user,
					body,
					ctx,
				});
			},
			{
				...credentialDocs.changePasswordAuthenticatedSchema,
				beforeHandle: [authenticate],
			}
		)
		.post(
			"/credentials/password/reset",
			(ctx: Context) => {
				const body = requestPasswordResetSchema.parse(ctx.body);
				return CredentialsController.requestPasswordReset({
					email: body.email,
					ctx,
				});
			},
			credentialDocs.requestPasswordResetSchema
		)
		.put(
			"/credentials/password/reset",
			(ctx: Context) => {
				const body = confirmPasswordResetSchema.parse(ctx.body);
				return CredentialsController.confirmPasswordReset({ body, ctx });
			},
			credentialDocs.confirmPasswordResetSchema
		)
		.get(
			"/credentials/password/reset",
			async (ctx: Context) => {
				const query = await z
					.object({ token: z.string() })
					.parseAsync(ctx.query);
				const token = decodeURIComponent(query.token);
				return CredentialsController.validatePasswordResetToken({
					token,
					ctx,
				});
			},
			credentialDocs.validatePasswordResetTokenSchema
		);
}
