import { cookieKey } from "@fixr/constants/cookies";
import { and, db, eq, gte, sql } from "@fixr/db/connection";
import { oneTimeTokens, refreshTokens, users } from "@fixr/db/schema";
import { env } from "@fixr/env/server";
import { generateOneTimeToken } from "../helpers/tokens";

export interface RefreshToken {
	token: string;
	expires: Date;
}

export interface CookieSetter {
	set(name: string, value: string, opts?: Record<string, unknown>): void;
}

/** Cookie options for the refresh token (httpOnly, 7d, secure) */
export const refreshTokenCookieOptions = {
	httpOnly: true,
	path: "/",
	sameSite: "none" as const,
	secure: true,
	domain: env.COOKIE_DOMAIN,
};

/** Cookie options for the JWT session token (NOT httpOnly — accessible by JS for Bearer usage) */
export const sessionCookieOptions = {
	path: "/",
	httpOnly: false,
	sameSite: "none" as const,
	expires: new Date(Date.now() + 5 * 60 * 1000),
	secure: true,
	domain: env.COOKIE_DOMAIN,
};

export async function persistRefreshToken(token: RefreshToken, userId: string) {
	/**
	 * We need to allow multiple sessions per user, so we insert the token and then delete only the expired ones, not all.
	 */
	const createRefresh = db.insert(refreshTokens).values({
		expiresAt: token.expires,
		token: token.token,
		userId,
	});

	const deleteExpired = db
		.delete(refreshTokens)
		.where(
			and(
				gte(sql`NOW()`, refreshTokens.expiresAt),
				eq(refreshTokens.userId, userId)
			)
		);

	// Executing both operations in parallel cuz they don't depend on each other.
	await Promise.allSettled([createRefresh, deleteExpired]);
}

export function setRefreshTokenCookie(
	cookie: Record<string, { value: string }>,
	token: RefreshToken
) {
	(
		cookie as unknown as {
			[key: string]: {
				value: string;
				domain: string;
				httpOnly: boolean;
				path: string;
				sameSite: string;
				secure: boolean;
				expires: Date;
			};
		}
	)[cookieKey("refreshToken")] = {
		value: token.token,
		...refreshTokenCookieOptions,
		expires: token.expires,
	};
}

export function setJWTCookie(
	cookie: Record<string, { value: string }>,
	token: string
) {
	(cookie as unknown as Record<string, unknown>)[cookieKey("session")] = {
		value: token,
		...sessionCookieOptions,
		expires: new Date(Date.now() + 5 * 60 * 1000),
	};
}

export async function setRefreshToken(
	cookie: Record<string, { value: string }>,
	token: RefreshToken,
	userId: string
) {
	await persistRefreshToken(token, userId);
	setRefreshTokenCookie(cookie, token);
}

export async function deleteRefreshToken(token: string) {
	return await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
}

export async function createOneTimeToken({
	userId,
	email,
	tokenType,
}: {
	userId: string;
	email: string;
	tokenType: "confirmation" | "password_reset" | "account_deletion";
}) {
	const token = generateOneTimeToken();

	await db.insert(oneTimeTokens).values({
		token,
		userId,
		tokenType,
		relatesTo: email,
		expiresAt: new Date(Date.now() + 30 * 60 * 1000),
	});

	const tokenData = await queryOneTimeToken(token);

	return tokenData;
}

export async function queryOneTimeToken(token: string) {
	const [oneTimeToken] = await db
		.select({
			id: oneTimeTokens.id,
			token: oneTimeTokens.token,
			tokenType: oneTimeTokens.tokenType,
			relatesTo: oneTimeTokens.relatesTo,
			userId: oneTimeTokens.userId,
			createdAt: oneTimeTokens.createdAt,
			expiresAt: oneTimeTokens.expiresAt,
			user: {
				id: users.id,
				email: users.email,
				createdAt: users.createdAt,
			},
		})
		.from(oneTimeTokens)
		.where(eq(oneTimeTokens.token, token))
		.innerJoin(users, eq(users.id, oneTimeTokens.userId))
		.limit(1);

	return oneTimeToken;
}

export async function deleteOneTimeToken(token: string) {
	return await db.delete(oneTimeTokens).where(eq(oneTimeTokens.token, token));
}

export async function deleteUserExpiredTokensByUserId(userId: string) {
	return await db
		.delete(oneTimeTokens)
		.where(
			and(
				eq(oneTimeTokens.userId, userId),
				gte(sql`NOW()`, oneTimeTokens.expiresAt)
			)
		);
}

export async function deleteUserExpiredTokensByEmail(email: string) {
	return await db
		.delete(oneTimeTokens)
		.where(
			and(
				eq(oneTimeTokens.relatesTo, email),
				gte(sql`NOW()`, oneTimeTokens.expiresAt)
			)
		);
}

export async function getUserOneTimeTokens(userId: string) {
	return await db
		.select()
		.from(oneTimeTokens)
		.where(eq(oneTimeTokens.userId, userId));
}

export async function getUserOneTimeTokensWithEmail(email: string) {
	return await db
		.select()
		.from(oneTimeTokens)
		.where(eq(oneTimeTokens.relatesTo, email));
}
