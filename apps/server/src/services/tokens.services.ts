import { and, eq, gte, sql } from "drizzle-orm";
import { FastifyReply } from "fastify";

import { db } from "../db/connection";
import { oneTimeTokens, refreshTokens, users } from "../db/schema";
import { generateOneTimeToken } from "../helpers/tokens";
import { cookieKey } from "@repo/constants/cookies";

export interface RefreshToken {
    token: string;
    expires: Date;
}

export async function setRefreshToken(response: FastifyReply, token: RefreshToken, userId: string) {
    const cookieOptions = {
        httpOnly: true,
        expires: token.expires, // Adds 7 days to the current date
        path: "/",
        sameSite: "none" as const,
        secure: true,
    };

    /**
     * We need to allow multiple sessions per user, so we insert the token and then delete only the expired ones, not all.
     */
    const createRefresh = db.insert(refreshTokens).values({
        expiresAt: token.expires,
        token: token.token,
        userId: userId,
    });

    const deleteExpired = db
        .delete(refreshTokens)
        .where(and(gte(sql`NOW()`, refreshTokens.expiresAt), eq(refreshTokens.userId, userId)));

    // Executing both operations in parallel cuz they don't depend on each other.
    await Promise.allSettled([createRefresh, deleteExpired]);

    response.setCookie(cookieKey("refreshToken"), token.token, cookieOptions);
}

export async function deleteRefreshToken(token: string) {
    return await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
}

export function setJWTCookie(response: FastifyReply, token: string) {
    const cookieOptions = {
        path: "/",
        httpOnly: false,
        sameSite: "none" as const,
        // expires: new Date(Date.now() + 10 * 1000),
        expires: new Date(Date.now() + 5 * 60 * 1000),
        secure: true,
    };

    response.setCookie(cookieKey("session"), token, cookieOptions);
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
        token: token,
        userId: userId,
        tokenType: tokenType,
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
                displayName: users.displayName,
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
        .where(and(eq(oneTimeTokens.userId, userId), gte(sql`NOW()`, oneTimeTokens.expiresAt)));
}

export async function deleteUserExpiredTokensByEmail(email: string) {
    return await db
        .delete(oneTimeTokens)
        .where(and(eq(oneTimeTokens.relatesTo, email), gte(sql`NOW()`, oneTimeTokens.expiresAt)));
}

export async function getUserOneTimeTokens(userId: string) {
    return await db.select().from(oneTimeTokens).where(eq(oneTimeTokens.userId, userId));
}

export async function getUserOneTimeTokensWithEmail(email: string) {
    return await db.select().from(oneTimeTokens).where(eq(oneTimeTokens.relatesTo, email));
}
