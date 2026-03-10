import { cookieKey } from "@fixr/constants/cookies";
import {
	createUserSchema,
	googleCallbackSchema,
	loginUserSchema,
	verifyEmailSchema,
} from "@fixr/schemas/auth";
import { Elysia, t } from "elysia";
import {
	googleCallbackHandler,
	googleLoginHandler,
} from "../controllers/auth/google-auth-handler";
import { loginHandler } from "../controllers/auth/login-handler";
import { revalidateHandler } from "../controllers/auth/revalidate-handler";
import { signOutHandler } from "../controllers/auth/signout-handler";
import { verifyHandler } from "../controllers/auth/verify-handler";
import { apiResponse } from "../helpers/response";

export const authRoutes = new Elysia({ prefix: "/auth" })
	.post(
		"/register",
		async ({ body, set }) => {
			const _validated = await createUserSchema.parseAsync(body);
			set.status = 501;
			return apiResponse({
				status: 501,
				error: "Not implemented",
				code: "not_implemented",
				message: "This endpoint is not implemented or disabled.",
				data: null,
			});
		},
		{
			body: t.Object({
				email: t.String({ format: "email" }),
				password: t.String({ minLength: 8 }),
			}),
		}
	)
	.post(
		"/login",
		async ({ body, cookie, set }) => {
			const validBody = await loginUserSchema.parseAsync(body);
			const result = await loginHandler({
				body: validBody,
				cookie: cookie as unknown as Record<string, { value: string }>,
			});
			set.status = result.status;
			return result.response;
		},
		{
			body: t.Object({
				email: t.String({ format: "email" }),
				password: t.String({ minLength: 1 }),
			}),
		}
	)
	.get(
		"/verify",
		async ({ query, cookie, set }) => {
			const validated = await verifyEmailSchema.parseAsync(query);
			const token = decodeURIComponent(validated.token);
			const result = await verifyHandler({
				token,
				redirectUrl: validated.redirectUrl,
				cookie: cookie as unknown as Record<string, { value: string }>,
			});
			if ("redirect" in result) {
				set.status = result.status;
				set.redirect = result.redirect;
				return;
			}
			set.status = result.status;
			return result.response;
		},
		{
			query: t.Object({
				token: t.String(),
				redirectUrl: t.Optional(t.String()),
			}),
		}
	)
	.get("/signout", async ({ cookie, set }) => {
		const refreshToken = cookie[cookieKey("refreshToken")]?.value as
			| string
			| undefined;
		const result = await signOutHandler({ refreshToken });
		set.status = result.status;
		return result.response;
	})
	.post("/token", async ({ cookie, set }) => {
		const refreshToken = cookie[cookieKey("refreshToken")]?.value as
			| string
			| undefined;
		const result = await revalidateHandler({
			refreshToken,
			cookie: cookie as unknown as Record<string, { value: string }>,
		});
		set.status = result.status;
		return result.response;
	})
	.get("/google", ({ set }) => {
		const url = googleLoginHandler();
		set.status = 302;
		set.redirect = url;
	})
	.get(
		"/google/callback",
		async ({ query, cookie, set }) => {
			const { code } = await googleCallbackSchema.parseAsync(query);
			const result = await googleCallbackHandler({
				code,
				cookie: cookie as unknown as Record<string, { value: string }>,
			});
			if ("redirect" in result) {
				set.status = result.status;
				set.redirect = result.redirect;
				return;
			}
			set.status = result.status;
			return result.response;
		},
		{
			query: t.Object({
				code: t.String(),
			}),
		}
	);
