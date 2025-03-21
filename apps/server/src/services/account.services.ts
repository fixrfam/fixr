import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@repo/db/connection";
import { users, userSelectSchema } from "@repo/db/schema";
import { editAccountSchema } from "@repo/schemas/account";
import { redis } from "../config/redis";
import { CACHE_TTL, userCacheKey } from "../helpers/cache";

export async function queryUserById(id: string) {
    const cacheKey = userCacheKey(id);
    const cached = await redis.get(cacheKey);

    if (cached) {
        return userSelectSchema.parse(JSON.parse(cached));
    }

    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

    await redis.set(cacheKey, JSON.stringify(user), "EX", CACHE_TTL);

    return user;
}

export async function updateUserById(data: z.infer<typeof editAccountSchema>, id: string) {
    await db.update(users).set(data).where(eq(users.id, id));

    const cacheKey = userCacheKey(id);
    await redis.del(cacheKey);

    const updatedUser = await queryUserById(id);

    return updatedUser;
}
