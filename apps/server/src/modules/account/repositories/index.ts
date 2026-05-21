import { db, eq, sql } from "@fixr/db/connection";
import { clients, companies, employees, users } from "@fixr/db/schema";
import { accountSchema } from "@fixr/schemas/account";
import { redis } from "../../../config/redis";
import { accountCacheKey, CACHE_TTL } from "../../../core/lib/cache";

/** @description Account data access layer */
export class AccountRepository {
	/**
	 * Query account data by user ID, with caching
	 *
	 * @param id - The user ID
	 * @returns The parsed account data
	 */
	static async queryAccountById(id: string) {
		const cacheKey = accountCacheKey(id);
		const cached = await redis.get(cacheKey);

		if (cached) {
			return accountSchema.parse(JSON.parse(cached));
		}

		const [account] = await db
			.select({
				id: users.id,
				email: users.email,
				displayName: sql`COALESCE(${employees.name}, ${clients.name})`,
				avatarUrl: users.avatarUrl,
				cpf: sql`COALESCE(${employees.cpf}, ${clients.cpf})`,
				phone: sql`COALESCE(${employees.phone}, ${clients.phone})`,
				profileType: sql`CASE
                          WHEN ${employees.id} IS NOT NULL THEN 'employee'
                          WHEN ${clients.id} IS NOT NULL THEN 'client'
                          ELSE 'unknown'
                        END`,
				company: sql`CASE
              WHEN ${employees.id} IS NOT NULL THEN JSON_OBJECT(
                'id', ${companies.id},
                'name', ${companies.name},
                'subdomain', ${companies.subdomain},
                'role', ${employees.role}
              )
              ELSE NULL
            END`,
				createdAt: users.createdAt,
			})
			.from(users)
			.leftJoin(employees, eq(employees.userId, users.id))
			.leftJoin(clients, eq(clients.userId, users.id))
			.leftJoin(companies, eq(companies.id, employees.companyId))
			.where(eq(users.id, id))
			.limit(1);

		await redis.set(cacheKey, JSON.stringify(account), "EX", CACHE_TTL);

		return accountSchema.parse(account);
	}
}
