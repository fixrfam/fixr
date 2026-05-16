import { cookieKey } from "@fixr/constants/cookies";
import {
	googleCallbackSchema,
	loginUserSchema,
	verifyEmailSchema,
} from "@fixr/schemas/auth";
import type { Context, Elysia } from "elysia";
import { authDocs } from "../../../core/docs/auth.docs";
import { apiResponse } from "../../../core/lib/response";
import { AuthController } from "../controllers";

export function authRoutes(app: Elysia) {
	return app
		.post(
			"/auth/register",
			(ctx: Context) => {
				ctx.set.status = 501;
				return apiResponse({
					status: 501,
					error: "Not implemented",
					code: "not_implemented",
					message: "This endpoint is not implemented or disabled.",
					data: null,
				});
			},
			authDocs.registerSchema
		)
		.post(
			"/auth/login",
			async (ctx: Context) => {
				const body = await loginUserSchema.parseAsync(ctx.body);
				return AuthController.login({ body, ctx });
			},
			authDocs.loginConfig
		)
		.get(
			"/auth/verify",
			async (ctx: Context) => {
				const query = await verifyEmailSchema.parseAsync(ctx.query);
				const token = decodeURIComponent(query.token);
				return AuthController.verify({
					token,
					redirectUrl: query.redirectUrl,
					ctx,
				});
			},
			authDocs.verifyConfig
		)
		.get(
			"/auth/signout",
			(ctx: Context) => {
				const cookie = ctx.cookie as Record<string, { value: string }>;
				const refreshToken = cookie[cookieKey("refreshToken")]?.value;
				return AuthController.signOut({ refreshToken, ctx });
			},
			authDocs.signOutConfig
		)
		.post(
			"/auth/token",
			(ctx: Context) => {
				const cookie = ctx.cookie as Record<string, { value: string }>;
				const refreshToken = cookie[cookieKey("refreshToken")]?.value;
				return AuthController.revalidate({ refreshToken, ctx });
			},
			authDocs.revalidateConfig
		)
		.get(
			"/auth/google",
			(ctx: Context) => {
				return AuthController.googleLogin({ ctx });
			},
			authDocs.googleLoginConfig
		)
		.get(
			"/auth/google/callback",
			async (ctx: Context) => {
				const { code } = await googleCallbackSchema.parseAsync(
					ctx.query as { code: string }
				);
				return AuthController.googleCallback({ code, ctx });
			},
			authDocs.googleCallbackConfig
		);
}
