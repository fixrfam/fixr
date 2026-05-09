import { cookieKey } from "@fixr/constants/cookies";
import { env } from "@fixr/env/server";
import type { FastifyReply } from "fastify";
import { generateOneTimeToken } from "../../lib/tokens";
import { TokensRepository } from "../repositories";

/** @description Token business logic layer for managing refresh tokens and one-time tokens */
export class TokensService {
	/**
	 * Set a refresh token cookie and persist it to the database.
	 * Also clean up any expired refresh tokens for the user.
	 *
	 * @param response - Fastify reply object
	 * @param token - The refresh token data
	 * @param userId - The user ID
	 */
	static async setRefreshToken(
		response: FastifyReply,
		token: { token: string; expires: Date },
		userId: string
	) {
		const cookieOptions = {
			httpOnly: true,
			expires: token.expires, // Adds 7 days to the current date
			path: "/",
			sameSite: "none" as const,
			secure: true,
			domain: env.COOKIE_DOMAIN,
		};

		/**
		 * We need to allow multiple sessions per user, so we insert the token and then delete only the expired ones, not all.
		 */
		const createRefresh = TokensRepository.insertRefreshToken(
			token.token,
			token.expires,
			userId
		);

		const deleteExpired = TokensRepository.deleteExpiredRefreshTokens(userId);

		// Executing both operations in parallel cuz they don't depend on each other.
		await Promise.allSettled([createRefresh, deleteExpired]);

		response.setCookie(cookieKey("refreshToken"), token.token, cookieOptions);
	}

	/**
	 * Set the JWT session cookie
	 *
	 * @param response - Fastify reply object
	 * @param token - The JWT token string
	 */
	static setJWTCookie(response: FastifyReply, token: string) {
		const cookieOptions = {
			path: "/",
			httpOnly: false,
			sameSite: "none" as const,
			// expires: new Date(Date.now() + 10 * 1000),
			expires: new Date(Date.now() + 5 * 60 * 1000),
			secure: true,
			domain: env.COOKIE_DOMAIN,
		};

		response.setCookie(cookieKey("session"), token, cookieOptions);
	}

	/**
	 * Create a one-time token for email verification, password reset, or account deletion
	 *
	 * @param userId - The user ID
	 * @param email - The user email
	 * @param tokenType - Type of token
	 * @returns The created token data
	 */
	static async createOneTimeToken({
		userId,
		email,
		tokenType,
	}: {
		userId: string;
		email: string;
		tokenType: "confirmation" | "password_reset" | "account_deletion";
	}) {
		const token = generateOneTimeToken();

		await TokensRepository.insertOneTimeToken(
			token,
			userId,
			tokenType,
			email,
			new Date(Date.now() + 30 * 60 * 1000)
		);

		const tokenData = await TokensRepository.queryOneTimeToken(token);

		return tokenData;
	}
}
