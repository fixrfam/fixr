import { cookieKey } from "@fixr/constants/cookies";
import { env } from "@fixr/env/server";
import type { Context } from "elysia";
import { generateOneTimeToken } from "../../../core/lib/tokens";
import { TokensRepository } from "../repositories";

export class TokensService {
	static async setRefreshToken(
		ctx: Context,
		token: { token: string; expires: Date },
		userId: string
	) {
		const cookieOptions = {
			httpOnly: true,
			expires: token.expires,
			path: "/",
			sameSite: "none" as const,
			secure: true,
			domain: env.COOKIE_DOMAIN,
		};

		const createRefresh = TokensRepository.insertRefreshToken(
			token.token,
			token.expires,
			userId
		);

		const deleteExpired = TokensRepository.deleteExpiredRefreshTokens(userId);

		await Promise.allSettled([createRefresh, deleteExpired]);

		ctx.cookie[cookieKey("refreshToken")]?.set({
			value: token.token,
			...cookieOptions,
		});
	}

	static setJWTCookie(ctx: Context, token: string) {
		const cookieOptions = {
			path: "/",
			httpOnly: false,
			sameSite: "none" as const,
			expires: new Date(Date.now() + 5 * 60 * 1000),
			secure: true,
			domain: env.COOKIE_DOMAIN,
		};

		ctx.cookie[cookieKey("session")]?.set({
			value: token,
			...cookieOptions,
		});
	}

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
