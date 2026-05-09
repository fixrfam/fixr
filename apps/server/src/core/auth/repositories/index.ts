import { db, eq, sql } from "@fixr/db/connection";
import { clients, companies, employees, users } from "@fixr/db/schema";
import {
	type createUserSchema,
	jwtPayload,
	userSchema,
} from "@fixr/schemas/auth";

import type { TokenPayload } from "google-auth-library";
import type { z } from "zod";
import { redis } from "../../../config/redis";
import { CACHE_TTL, jwtPayloadCacheKey, userCacheKey } from "../../lib/cache";

/** @description User data access layer */
export class AuthRepository {
	/**
	 * Query a user by their ID, with caching
	 *
	 * @param id - The user ID
	 * @returns The parsed user data
	 */
	static async queryUserById(id: string) {
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
				avatarUrl: users.avatarUrl,
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
	 * @param email - The user email
	 * @returns The parsed user data or null if not found
	 */
	static async queryUserByEmail(
		email: string
	): Promise<z.infer<typeof userSchema> | null> {
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
				avatarUrl: users.avatarUrl,
				createdAt: users.createdAt,
				verified: users.verified,
			})
			.from(users)
			.leftJoin(employees, eq(employees.userId, users.id))
			.leftJoin(clients, eq(clients.userId, users.id))
			.where(eq(users.email, email))
			.limit(1);

		if (!user) {
			return null;
		}

		return userSchema.parse(user);
	}

	/**
	 * Query JWT payload data for a user, with caching
	 *
	 * @param userId - The user ID
	 * @returns The parsed JWT payload
	 */
	static async queryJWTPayloadByUserId(userId: string) {
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
				avatarUrl: users.avatarUrl,
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

	/**
	 * Create a new user in the database
	 *
	 * @param user - The user data (without password field, with passwordHash)
	 * @returns The created user
	 */
	static async createUser(
		user: Omit<z.infer<typeof createUserSchema>, "password"> & {
			passwordHash: string;
		}
	) {
		const [created] = await db.insert(users).values(user).$returningId();

		const newUser = await AuthRepository.queryUserById(created.id);

		return newUser;
	}

	/**
	 * Mark a user as verified
	 *
	 * @param userId - The user ID
	 */
	static async setUserVerified(userId: string) {
		const verifyUser = db
			.update(users)
			.set({ verified: true })
			.where(eq(users.id, userId));

		const cacheKey = userCacheKey(userId);
		await redis.del(cacheKey);

		return await verifyUser;
	}

	/**
	 * Delete a user from the database
	 *
	 * @param userId - The user ID
	 */
	static async deleteUser(userId: string) {
		const delUser = db.delete(users).where(eq(users.id, userId));

		const cacheKey = userCacheKey(userId);
		await redis.del(cacheKey);

		return await delUser;
	}

	/**
	 * Update user data with Google profile information
	 *
	 * @param userId - The user ID
	 * @param data - Google token payload data
	 */
	static async updateUserWithGoogleData({
		userId,
		data,
	}: {
		userId: string;
		data: Partial<TokenPayload>;
	}) {
		const invalidate = {
			user: userCacheKey(userId),
			jwt: jwtPayloadCacheKey(userId),
		};

		// Use Promise.all for parallel cache invalidation instead of sequential loop
		await Promise.all(Object.values(invalidate).map((key) => redis.del(key)));

		return await db
			.update(users)
			.set({ googleId: data.sub, avatarUrl: data.picture })
			.where(eq(users.id, userId));
	}
}
