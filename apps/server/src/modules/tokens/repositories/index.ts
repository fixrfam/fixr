import { and, db, eq, gte, sql } from "@fixr/db/connection";
import { oneTimeTokens, refreshTokens, users } from "@fixr/db/schema";

/** @description Token data access layer for refresh tokens and one-time tokens */
export class TokensRepository {
	/**
	 * Query a refresh token from the database by its token value
	 *
	 * @param token - The refresh token string
	 * @returns The token data with associated user info
	 */
	static async queryTokenData(token: string) {
		const [data] = await db
			.select({
				id: refreshTokens.id,
				userId: refreshTokens.userId,
				token: refreshTokens.token,
				createdAt: refreshTokens.createdAt,
				expiresAt: refreshTokens.expiresAt,
				user: {
					id: users.id,
					email: users.email,
					createdAt: users.createdAt,
				},
			})
			.from(refreshTokens)
			.where(eq(refreshTokens.token, token))
			.innerJoin(users, eq(users.id, refreshTokens.userId));

		return data;
	}

	/**
	 * Delete a refresh token from the database
	 *
	 * @param token - The refresh token string to delete
	 */
	static async deleteRefreshToken(token: string) {
		return await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
	}

	/**
	 * Insert a new refresh token for a user
	 *
	 * @param token - The refresh token string
	 * @param expiresAt - Token expiration date
	 * @param userId - The user ID
	 */
	static async insertRefreshToken(
		token: string,
		expiresAt: Date,
		userId: string
	) {
		return await db.insert(refreshTokens).values({
			expiresAt,
			token,
			userId,
		});
	}

	/**
	 * Delete expired refresh tokens for a user
	 *
	 * @param userId - The user ID
	 */
	static async deleteExpiredRefreshTokens(userId: string) {
		return await db
			.delete(refreshTokens)
			.where(
				and(
					gte(sql`NOW()`, refreshTokens.expiresAt),
					eq(refreshTokens.userId, userId)
				)
			);
	}

	/**
	 * Query a one-time token from the database
	 *
	 * @param token - The one-time token string
	 * @returns The token data with associated user info
	 */
	static async queryOneTimeToken(token: string) {
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

	/**
	 * Insert a new one-time token
	 *
	 * @param token - The token value
	 * @param userId - The user ID
	 * @param tokenType - Type of token (confirmation, password_reset, account_deletion)
	 * @param relatesTo - Email related to the token
	 * @param expiresAt - Token expiration date
	 */
	static async insertOneTimeToken(
		token: string,
		userId: string,
		tokenType: "confirmation" | "password_reset" | "account_deletion",
		relatesTo: string,
		expiresAt: Date
	) {
		await db.insert(oneTimeTokens).values({
			token,
			userId,
			tokenType,
			relatesTo,
			expiresAt,
		});
	}

	/**
	 * Delete a one-time token
	 *
	 * @param token - The token value to delete
	 */
	static async deleteOneTimeToken(token: string) {
		return await db.delete(oneTimeTokens).where(eq(oneTimeTokens.token, token));
	}

	/**
	 * Delete expired one-time tokens for a specific user
	 *
	 * @param userId - The user ID
	 */
	static async deleteUserExpiredTokensByUserId(userId: string) {
		return await db
			.delete(oneTimeTokens)
			.where(
				and(
					eq(oneTimeTokens.userId, userId),
					gte(sql`NOW()`, oneTimeTokens.expiresAt)
				)
			);
	}

	/**
	 * Delete expired one-time tokens for a specific email
	 *
	 * @param email - The email address
	 */
	static async deleteUserExpiredTokensByEmail(email: string) {
		return await db
			.delete(oneTimeTokens)
			.where(
				and(
					eq(oneTimeTokens.relatesTo, email),
					gte(sql`NOW()`, oneTimeTokens.expiresAt)
				)
			);
	}

	/**
	 * Get all one-time tokens for a user
	 *
	 * @param userId - The user ID
	 */
	static async getUserOneTimeTokens(userId: string) {
		return await db
			.select()
			.from(oneTimeTokens)
			.where(eq(oneTimeTokens.userId, userId));
	}

	/**
	 * Get all one-time tokens associated with an email
	 *
	 * @param email - The email address
	 */
	static async getUserOneTimeTokensWithEmail(email: string) {
		return await db
			.select()
			.from(oneTimeTokens)
			.where(eq(oneTimeTokens.relatesTo, email));
	}
}
