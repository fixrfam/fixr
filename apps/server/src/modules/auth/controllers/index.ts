import type { createUserSchema, loginUserSchema } from "@fixr/schemas/auth";
import type { Context } from "elysia";
import type { z } from "zod";
import { AuthService } from "../services";

export class AuthController {
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

	static login({
		body,
		ctx,
	}: {
		body: z.infer<typeof loginUserSchema>;
		ctx: Context;
	}) {
		return AuthService.login({ body, ctx });
	}

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

	static signOut({
		refreshToken,
		ctx,
	}: {
		refreshToken: string | undefined;
		ctx: Context;
	}) {
		return AuthService.signOut({ refreshToken, ctx });
	}

	static revalidate({
		refreshToken,
		ctx,
	}: {
		refreshToken: string | undefined;
		ctx: Context;
	}) {
		return AuthService.revalidate({ refreshToken, ctx });
	}

	static googleLogin({ ctx }: { ctx: Context }) {
		return AuthService.googleLogin({ ctx });
	}

	static googleCallback({ code, ctx }: { code: string; ctx: Context }) {
		return AuthService.googleCallback({ code, ctx });
	}
}
