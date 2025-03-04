import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/connection";
import { users, userSelectSchema } from "../db/schema";
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
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning({
        id: users.id,
        displayName: users.displayName,
        email: users.email,
        createdAt: users.createdAt,
    });

    const cacheKey = userCacheKey(id);
    await redis.del(cacheKey);

    return updated;
}
