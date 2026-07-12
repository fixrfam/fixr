import { CacheService } from "../service/cache-service";

/**
 * Caches the return value of a static method in Redis.
 *
 * The cache key is derived from the provided key prefix and the serialized
 * arguments of the method call, so different arguments produce distinct keys.
 *
 * On cache hit the parsed value is returned and a hit is logged.
 * On cache miss the original method executes, its result is stored with the
 * configured TTL, and a miss is logged.
 * If Redis is unavailable the method executes without caching (fail-open).
 *
 * @param options.ttl - Time-to-live in seconds
 * @param options.key  - Cache key prefix (e.g. 'user', 'models:detail')
 */
export function Cached(options: { ttl: number; key: string }) {
	return (
		_target: unknown,
		_propertyKey: string,
		descriptor: PropertyDescriptor
	): PropertyDescriptor => {
		const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

		descriptor.value = async function (
			this: unknown,
			...args: unknown[]
		): Promise<unknown> {
			const cacheKey =
				args.length > 0
					? `${options.key}:${JSON.stringify(args)}`
					: options.key;

			const cached = await CacheService.get<unknown>(cacheKey);

			if (cached !== null) {
				console.log(`[Cache] HIT for "${cacheKey}"`);
				return cached;
			}

			console.log(`[Cache] MISS for "${cacheKey}"`);
			const result = await originalMethod.apply(this, args);

			await CacheService.set(cacheKey, result, options.ttl);

			return result;
		};

		return descriptor;
	};
}
