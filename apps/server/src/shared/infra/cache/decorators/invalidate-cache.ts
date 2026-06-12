import { CacheService } from "../service/cache-service";

/**
 * Invalidates Redis cache entries after the decorated method executes
 * successfully.
 *
 * Accepts glob-style key patterns (e.g. 'user:*', 'models:*') and uses Redis
 * SCAN to find matching keys before deleting them in bulk. This supports loose
 * invalidation: a pattern like 'user:*' will match 'user:abc', 'user:["xyz"]',
 * etc.
 *
 * If Redis is unavailable a warning is logged and execution continues
 * (fail-open).
 *
 * @param options.patterns - Array of key patterns to invalidate after the method runs
 */
export function InvalidateCache(options: { patterns: string[] }) {
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
			const result = await originalMethod.apply(this, args);

			console.log(
				`[Cache] Invalidating patterns: ${options.patterns.join(", ")}`
			);
			await CacheService.invalidatePatterns(options.patterns);

			return result;
		};

		return descriptor;
	};
}
