import { eq, sql } from "drizzle-orm";

import { db } from "@repo/db/connection";
import { clients, companies, employees, refreshTokens, users } from "@repo/db/schema";
import { createUserSchema, jwtPayload, userSchema } from "@repo/schemas/auth";
import { z } from "zod";
import { CACHE_TTL, jwtPayloadCacheKey, userCacheKey } from "../helpers/cache";
import { redis } from "../config/redis";

export async function queryUserById(id: string) {
    const cacheKey = userCacheKey(id);
    const cached = await redis.get(cacheKey);

    if (cached) {
        return userSchema.parse(JSON.parse(cached));
    }

    const [user] = await db
        .select({
            id: users.id,
            email: users.email,
            displayName: sql`COALESCE(${employees.name}, ${clients.name})`,
            passwordHash: users.passwordHash,
            profileType: sql`CASE
                          WHEN ${employees.id} IS NOT NULL THEN 'employee'
                          WHEN ${clients.id} IS NOT NULL THEN 'client'
                          ELSE 'unknown'
                        END`,
            createdAt: users.createdAt,
            verified: users.verified,
        })
        .from(users)
        .leftJoin(employees, eq(employees.userId, users.id))
        .leftJoin(clients, eq(clients.userId, users.id))
        .where(eq(users.id, id))
        .limit(1);

    await redis.set(cacheKey, JSON.stringify(user), "EX", CACHE_TTL);

    return userSchema.parse(user);
}

/**
 * Query a user by their email, returning all data including sensitive (passwordHash).
 *
 * @param email
 * @returns
 */
export async function queryUserByEmail(email: string): Promise<z.infer<typeof userSchema>> {
    const [user] = await db
        .select({
            id: users.id,
            email: users.email,
            displayName: sql`COALESCE(${employees.name}, ${clients.name})`,
            passwordHash: users.passwordHash,
            profileType: sql`CASE
                      WHEN ${employees.id} IS NOT NULL THEN 'employee'
                      WHEN ${clients.id} IS NOT NULL THEN 'client'
                      ELSE 'unknown'
                    END`,
            createdAt: users.createdAt,
            verified: users.verified,
        })
        .from(users)
        .leftJoin(employees, eq(employees.userId, users.id))
        .leftJoin(clients, eq(clients.userId, users.id))
        .where(eq(users.email, email))
        .limit(1);

    return userSchema.parse(user);
}

export async function queryJWTPayloadByUserId(userId: string) {
    const cacheKey = jwtPayloadCacheKey(userId);
    const cached = await redis.get(cacheKey);

    if (cached) {
        return jwtPayload.parse(JSON.parse(cached));
    }

    const [payload] = await db
        .select({
            id: users.id,
            email: users.email,
            displayName: sql`COALESCE(${employees.name}, ${clients.name})`,
            profileType: sql`CASE
                          WHEN ${employees.id} IS NOT NULL THEN 'employee'
                          WHEN ${clients.id} IS NOT NULL THEN 'client'
                          ELSE 'unknown'
                      END`,
            company: sql`
            CASE
              WHEN ${employees.id} IS NOT NULL THEN JSON_OBJECT(
                'id', ${companies.id},
                'name', ${companies.name},
                'subdomain', ${companies.subdomain},
                'role', ${employees.role}
              )
              ELSE NULL
            END
          `,
            createdAt: users.createdAt,
        })
        .from(users)
        .leftJoin(employees, eq(employees.userId, users.id))
        .leftJoin(clients, eq(clients.userId, users.id))
        .leftJoin(companies, eq(employees.companyId, companies.id))
        .where(eq(users.id, userId));

    await redis.set(cacheKey, JSON.stringify(payload), "EX", CACHE_TTL);

    return jwtPayload.parse(payload);
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
    const [created] = await db.insert(users).values(user).$returningId();

    const newUser = await queryUserById(created.id);

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
