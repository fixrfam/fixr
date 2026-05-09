import type { createUserSchema, loginUserSchema } from "@fixr/schemas/auth";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { z } from "zod";
import { AuthService } from "../services";

/** @description Auth request handlers */
export class AuthController {
	/**
	 * @description Register a new user account
	 */
	static async register({
		body,
		request,
		response,
	}: {
		body: z.infer<typeof createUserSchema>;
		request: FastifyRequest;
		response: FastifyReply;
	}) {
		return AuthService.register({ body, request, response });
	}

	/**
	 * @description Login with email and password
	 */
	static async login({
		body,
		response,
	}: {
		body: z.infer<typeof loginUserSchema>;
		response: FastifyReply;
	}) {
		return AuthService.login({ body, response });
	}

	/**
	 * @description Verify email with confirmation token
	 */
	static async verify({
		token,
		redirectUrl,
		response,
	}: {
		token: string;
		redirectUrl?: string;
		response: FastifyReply;
	}) {
		return AuthService.verify({ token, redirectUrl, response });
	}

	/**
	 * @description Sign out by deleting refresh token
	 */
	static async signOut({
		refreshToken,
		response,
	}: {
		refreshToken: string | undefined;
		response: FastifyReply;
	}) {
		return AuthService.signOut({ refreshToken, response });
	}

	/**
	 * @description Revalidate JWT with refresh token
	 */
	static async revalidate({
		refreshToken,
		response,
	}: {
		refreshToken: string | undefined;
		response: FastifyReply;
	}) {
		return AuthService.revalidate({ refreshToken, response });
	}

	/**
	 * @description Initiate Google OAuth login
	 */
	static async googleLogin({
		request,
		response,
	}: {
		request: FastifyRequest;
		response: FastifyReply;
	}) {
		return AuthService.googleLogin({ response });
	}

	/**
	 * @description Handle Google OAuth callback
	 */
	static async googleCallback({
		code,
		response,
	}: {
		code: string;
		response: FastifyReply;
	}) {
		return AuthService.googleCallback({ code, response });
	}
}
