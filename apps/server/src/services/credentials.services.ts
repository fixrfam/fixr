import { db, eq } from "@fixr/db/connection";
import { users } from "@fixr/db/schema";
import { redis } from "../config/redis";
import { userCacheKey } from "../helpers/cache";

export async function updateUserPassword(userId: string, passwordHash: string) {
	const updatePass = db
		.update(users)
		.set({ passwordHash })
		.where(eq(users.id, userId));

	const cacheKey = userCacheKey(userId);
	await redis.del(cacheKey);

	return await updatePass;
}
