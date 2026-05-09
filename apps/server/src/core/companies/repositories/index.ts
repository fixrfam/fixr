import { db, eq } from "@fixr/db/connection";
import { companies, companySelectSchema } from "@fixr/db/schema";
import { redis } from "../../../config/redis";
import { CACHE_TTL, companyCacheKey } from "../../lib/cache";

/** @description Companies data access layer */
export class CompaniesRepository {
	/**
	 * Query a company by its ID, with caching
	 *
	 * @param id - The company ID
	 * @returns The parsed company data
	 */
	static async queryCompanyById(id: string) {
		const cacheKey = companyCacheKey(id);
		const cached = await redis.get(cacheKey);

		if (cached) {
			return companySelectSchema.parse(JSON.parse(cached));
		}

		const [company] = await db
			.select()
			.from(companies)
			.where(eq(companies.id, id))
			.limit(1);

		await redis.set(cacheKey, JSON.stringify(company), "EX", CACHE_TTL);

		return companySelectSchema.parse(company);
	}

	/**
	 * Query a company by its subdomain, with caching
	 *
	 * @param subdomain - The company subdomain
	 * @returns The parsed company data
	 */
	static async queryCompanyBySubdomain(subdomain: string) {
		const cacheKey = companyCacheKey(subdomain);
		const cached = await redis.get(cacheKey);

		if (cached) {
			return companySelectSchema.parse(JSON.parse(cached));
		}

		const [company] = await db
			.select()
			.from(companies)
			.where(eq(companies.subdomain, subdomain))
			.limit(1);

		await redis.set(cacheKey, JSON.stringify(company), "EX", CACHE_TTL);

		return companySelectSchema.parse(company);
	}
}
