import { db } from '@fixr/db/connection'
import { companies, companySelectSchema } from '@fixr/db/schema'
import { eq } from 'drizzle-orm'
import { redis } from '@/src/config/redis'
import { CACHE_TTL, companyCacheKey } from '@/src/helpers/cache'

export async function queryCompanyById(id: string) {
  const cacheKey = companyCacheKey(id)
  const cached = await redis.get(cacheKey)

  if (cached) {
    return companySelectSchema.parse(JSON.parse(cached))
  }

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, id))
    .limit(1)

  await redis.set(cacheKey, JSON.stringify(company), 'EX', CACHE_TTL)

  return companySelectSchema.parse(company)
}

export async function queryCompanyBySubdomain(subdomain: string) {
  const cacheKey = companyCacheKey(subdomain)
  const cached = await redis.get(cacheKey)

  if (cached) {
    return companySelectSchema.parse(JSON.parse(cached))
  }

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.subdomain, subdomain))
    .limit(1)

  await redis.set(cacheKey, JSON.stringify(company), 'EX', CACHE_TTL)

  return companySelectSchema.parse(company)
}
