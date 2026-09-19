import { redis } from "../../../../config/redis";

/**
 * Service that wraps ioredis with fail-open behavior.
 *
 * If Redis is unavailable, reads return null and writes are silently skipped,
 * allowing the application to continue without caching.
 */
export class CacheService {
	/**
	 * Retrieve a cached value by key.
	 *
	 * @param key - The cache key
	 * @returns The parsed value, or null if not found or Redis is unavailable
	 */
	static async get<T>(key: string): Promise<T | null> {
		try {
			const raw = await redis.get(key);
			if (raw === null) {
				return null;
			}
			return JSON.parse(raw) as T;
		} catch (error) {
			console.warn(`[CacheService] GET failed for key "${key}":`, error);
			return null;
		}
	}

	/**
	 * Store a value in the cache with a TTL.
	 *
	 * @param key   - The cache key
	 * @param value - The value to serialize and store
	 * @param ttl   - Time-to-live in seconds
	 */
	static async set(key: string, value: unknown, ttl: number): Promise<void> {
		try {
			await redis.set(key, JSON.stringify(value), "EX", ttl);
		} catch (error) {
			console.warn(`[CacheService] SET failed for key "${key}":`, error);
		}
	}

	/**
	 * Delete a single cache key.
	 *
	 * @param key - The cache key to delete
	 */
	static async del(key: string): Promise<void> {
		try {
			await redis.del(key);
		} catch (error) {
			console.warn(`[CacheService] DEL failed for key "${key}":`, error);
		}
	}

	/**
	 * Find all keys matching a glob pattern using Redis SCAN.
	 *
	 * Uses cursor-based iteration to avoid blocking Redis.
	 *
	 * @param pattern - The glob pattern to match (e.g. 'user:*')
	 * @returns An array of matching key names
	 */
	static async scan(pattern: string): Promise<string[]> {
		const keys: string[] = [];
		let cursor = "0";

		try {
			do {
				const result = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
				cursor = result[0];
				keys.push(...result[1]);
			} while (cursor !== "0");
		} catch (error) {
			console.warn(
				`[CacheService] SCAN failed for pattern "${pattern}":`,
				error
			);
		}

		return keys;
	}

	/**
	 * Delete all keys matching one or more glob patterns.
	 *
	 * Each pattern is scanned and matching keys are deleted in bulk.
	 *
	 * @param patterns - Array of glob patterns to invalidate
	 */
	static async invalidatePatterns(patterns: string[]): Promise<void> {
		try {
			const keysToDelete = new Set<string>();

			for (const pattern of patterns) {
				const matched = await CacheService.scan(pattern);
				for (const key of matched) {
					keysToDelete.add(key);
				}
			}

			if (keysToDelete.size > 0) {
				await redis.del([...keysToDelete]);
			}
		} catch (error) {
			console.warn("[CacheService] invalidatePatterns failed:", error);
		}
	}
}
