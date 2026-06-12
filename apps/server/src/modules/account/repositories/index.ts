import { db, eq, sql } from "@fixr/db/connection";
import { clients, companies, employees, users } from "@fixr/db/schema";
import { accountSchema } from "@fixr/schemas/account";
import { Cached } from "../../../shared/infra/cache";

/** @description Account data access layer */
export class AccountRepository {
	/**
	 * Query account data by user ID, with caching
	 *
	 * @param id - The user ID
	 * @returns The parsed account data
	 */
	@Cached({ ttl: 3600, key: "account" })
	static async queryAccountById(id: string) {
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

		return accountSchema.parse(account);
	}
}
