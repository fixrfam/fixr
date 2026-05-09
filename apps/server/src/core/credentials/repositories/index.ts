import { db, eq } from "@fixr/db/connection";
import { users } from "@fixr/db/schema";
import { redis } from "../../../config/redis";
import { userCacheKey } from "../../lib/cache";

/** @description Credentials data access layer */
export class CredentialsRepository {
	/**
	 * Update a user's password hash
	 *
	 * @param userId - The user ID
	 * @param passwordHash - The new bcrypt hash
	 */
	static async updateUserPassword(userId: string, passwordHash: string) {
		const updatePass = db
			.update(users)
			.set({ passwordHash })
			.where(eq(users.id, userId));

		const cacheKey = userCacheKey(userId);
		await redis.del(cacheKey);

		return await updatePass;
	}
}
