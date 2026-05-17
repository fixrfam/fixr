import type { createUserSchema, loginUserSchema } from "@fixr/schemas/auth";
import type { Context } from "elysia";
import type { z } from "zod";
import { AuthService } from "../services";

/** @description Auth request handlers */
export class AuthController {
	/** @description Register a new user account */
	static register({
		body,
		_request,
		ctx,
	}: {
		body: z.infer<typeof createUserSchema>;
		_request: Context;
		ctx: Context;
	}) {
		return AuthService.register({ body, _request: ctx, ctx });
	}

	/** @description Login with email and password */
	static login({
		body,
		ctx,
	}: {
		body: z.infer<typeof loginUserSchema>;
		ctx: Context;
	}) {
		return AuthService.login({ body, ctx });
	}

	/** @description Verify email with confirmation token */
	static verify({
		token,
		redirectUrl,
		ctx,
	}: {
		token: string;
		redirectUrl?: string;
		ctx: Context;
	}) {
		return AuthService.verify({ token, redirectUrl, ctx });
	}

	/** @description Sign out by deleting refresh token */
	static signOut({
		refreshToken,
		ctx,
	}: {
		refreshToken: string | undefined;
		ctx: Context;
	}) {
		return AuthService.signOut({ refreshToken, ctx });
	}

	/** @description Revalidate JWT with refresh token */
	static revalidate({
		refreshToken,
		ctx,
	}: {
		refreshToken: string | undefined;
		ctx: Context;
	}) {
		return AuthService.revalidate({ refreshToken, ctx });
	}

	/** @description Initiate Google OAuth login */
	static googleLogin({ ctx }: { ctx: Context }) {
		return AuthService.googleLogin({ ctx });
	}

	/** @description Handle Google OAuth callback */
	static googleCallback({ code, ctx }: { code: string; ctx: Context }) {
		return AuthService.googleCallback({ code, ctx });
	}
}
