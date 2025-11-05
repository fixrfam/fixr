import { db } from '@fixr/db/connection'
import { clients, companies, employees, users } from '@fixr/db/schema'
import { accountSchema } from '@fixr/schemas/account'
import { jwtPayload } from '@fixr/schemas/auth'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { redis } from '../config/redis'
import { accountCacheKey, CACHE_TTL } from '../helpers/cache'

export async function queryAccountById(id: string) {
  const cacheKey = accountCacheKey(id)
  const cached = await redis.get(cacheKey)

  if (cached) {
    return accountSchema.parse(JSON.parse(cached))
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
    .limit(1)

  await redis.set(cacheKey, JSON.stringify(account), 'EX', CACHE_TTL)

  return accountSchema.parse(account)
}
