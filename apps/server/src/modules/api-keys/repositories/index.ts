import { and, db, eq, isNull } from "@fixr/db/connection";
import { apiKeys, companies, employees, users } from "@fixr/db/schema";
import { Cached, InvalidateCache } from "../../../shared/infra/cache";

/**
 * How long an authentication lookup may be served from cache.
 *
 * Kept short so a revocation that somehow misses the explicit invalidation
 * still stops working quickly.
 */
const AUTH_LOOKUP_TTL_SECONDS = 60;

/** @description API keys data access layer */
export class ApiKeysRepository {
	/**
	 * Resolve a key by its public prefix, along with the owning employee's role.
	 *
	 * The role is read at request time (never stored on the key) so that
	 * demoting or removing an employee immediately narrows what their keys can do.
	 *
	 * @param prefix - The public prefix parsed from the token
	 * @returns The key joined with its employee and company, or undefined
	 */
	@Cached({ ttl: AUTH_LOOKUP_TTL_SECONDS, key: "api-keys:prefix" })
	static async getByPrefix(prefix: string) {
		const [data] = await db
			.select({
				id: apiKeys.id,
				prefix: apiKeys.prefix,
				keyHash: apiKeys.keyHash,
				scopes: apiKeys.scopes,
				expiresAt: apiKeys.expiresAt,
				revokedAt: apiKeys.revokedAt,
				lastUsedAt: apiKeys.lastUsedAt,
				employeeId: apiKeys.employeeId,
				companyId: apiKeys.companyId,
				employeeRole: employees.role,
				employeeName: employees.name,
				companyName: companies.name,
				companySubdomain: companies.subdomain,
				userId: users.id,
				userEmail: users.email,
				userAvatarUrl: users.avatarUrl,
				userCreatedAt: users.createdAt,
			})
			.from(apiKeys)
			.innerJoin(employees, eq(employees.id, apiKeys.employeeId))
			.innerJoin(companies, eq(companies.id, apiKeys.companyId))
			.innerJoin(users, eq(users.id, employees.userId))
			.where(eq(apiKeys.prefix, prefix))
			.limit(1);

		return data;
	}

	/**
	 * Get a single key scoped to a company.
	 *
	 * @param apiKeyId - The key ID
	 * @param companyId - The company the key must belong to
	 * @returns The key or undefined
	 */
	static async getByIdAndCompany({
		apiKeyId,
		companyId,
	}: {
		apiKeyId: string;
		companyId: string;
	}) {
		const [data] = await db
			.select()
			.from(apiKeys)
			.where(and(eq(apiKeys.id, apiKeyId), eq(apiKeys.companyId, companyId)))
			.limit(1);

		return data;
	}

	/**
	 * Find an active (non-revoked) key by name within a company.
	 *
	 * @param name - The key name
	 * @param companyId - The company ID
	 * @returns The key or undefined
	 */
	static async getActiveByNameAndCompany({
		name,
		companyId,
	}: {
		name: string;
		companyId: string;
	}) {
		const [data] = await db
			.select({ id: apiKeys.id })
			.from(apiKeys)
			.where(
				and(
					eq(apiKeys.name, name),
					eq(apiKeys.companyId, companyId),
					isNull(apiKeys.revokedAt)
				)
			)
			.limit(1);

		return data;
	}

	/**
	 * Persist a new key.
	 *
	 * @param data - The key row to insert
	 * @returns The generated key ID
	 */
	@InvalidateCache({ patterns: ["api-keys:*"] })
	static async createApiKey(data: {
		name: string;
		prefix: string;
		keyHash: string;
		employeeId: string;
		companyId: string;
		scopes: string[];
		expiresAt: Date | null;
	}) {
		const [inserted] = await db.insert(apiKeys).values(data).$returningId();

		return inserted.id;
	}

	/**
	 * Mark a key as revoked. Revocation is a soft delete so the audit trail survives.
	 *
	 * @param apiKeyId - The key ID
	 */
	@InvalidateCache({ patterns: ["api-keys:*"] })
	static async revokeApiKey(apiKeyId: string) {
		await db
			.update(apiKeys)
			.set({ revokedAt: new Date() })
			.where(eq(apiKeys.id, apiKeyId));
	}

	/**
	 * Record that a key was used.
	 *
	 * Deliberately not cache-invalidating: this runs on every authenticated
	 * request and is throttled by the caller.
	 *
	 * @param apiKeyId - The key ID
	 */
	static async touchLastUsedAt(apiKeyId: string) {
		await db
			.update(apiKeys)
			.set({ lastUsedAt: new Date() })
			.where(eq(apiKeys.id, apiKeyId));
	}
}
