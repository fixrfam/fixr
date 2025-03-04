import { eq } from "drizzle-orm";

import { db } from "../db/connection";
import { refreshTokens, users } from "../db/schema";
import { createUserSchema } from "@repo/schemas/auth";
import { z } from "zod";
import { userCacheKey } from "../helpers/cache";
import { redis } from "../config/redis";

export async function queryUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
}

export async function queryTokenData(token: string) {
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
                displayName: users.displayName,
            },
        })
        .from(refreshTokens)
        .where(eq(refreshTokens.token, token))
        .innerJoin(users, eq(users.id, refreshTokens.userId));

    return data;
}

export async function createUser(
    user: Omit<z.infer<typeof createUserSchema>, "password"> & { passwordHash: string }
) {
    const [newUser] = await db.insert(users).values(user).returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        createdAt: users.createdAt,
    });
    return newUser;
}

export async function setUserVerified(userId: string) {
    const verifyUser = db.update(users).set({ verified: true }).where(eq(users.id, userId));

    const cacheKey = userCacheKey(userId);
    await redis.del(cacheKey);

    return await verifyUser;
}

export async function deleteUser(userId: string) {
    const delUser = db.delete(users).where(eq(users.id, userId));

    const cacheKey = userCacheKey(userId);
    await redis.del(cacheKey);

    return await delUser;
}
