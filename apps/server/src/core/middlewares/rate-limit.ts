import fastifyRateLimit from "@fastify/rate-limit";
import { env } from "@fixr/env/server";
import type { FastifyInstance, FastifyRequest } from "fastify";
import Redis from "ioredis";
import { apiResponse } from "../lib/response";

/** Requests allowed per window when a route does not override the policy. */
const DEFAULT_MAX_REQUESTS = 100;

const DEFAULT_TIME_WINDOW = "1 minute";

/** Keeps rate limit counters from colliding with the cache decorators' keys. */
const NAMESPACE = "fixr:rate-limit:";

/**
 * A strategy that identifies which bucket a request should be counted against.
 *
 * Returns `null` when it does not recognise the request, letting the next
 * strategy try.
 */
export type BucketResolver = (request: FastifyRequest) => string | null;

const resolvers: BucketResolver[] = [];

/**
 * Registers a strategy for identifying rate limit buckets.
 *
 * Strategies run in registration order and the first non-null result wins, so
 * register the most specific one first. A module that introduces its own kind
 * of credential (an integration key, a webhook signature) plugs in here instead
 * of this file having to know about it.
 *
 * Bear in mind that the limiter runs on the `onRequest` hook, before any
 * authentication middleware: a resolver only has the raw request to work with,
 * never `request.user`. That is deliberate — it means a flood of invalid
 * credentials is throttled before it reaches the database.
 *
 * @param resolver - The strategy to add
 */
export function registerBucketResolver(resolver: BucketResolver): void {
	resolvers.push(resolver);
}

/**
 * Resolves the bucket for a request, falling back to the client IP.
 *
 * @param request - The incoming request
 * @returns The rate limit bucket key
 */
function keyGenerator(request: FastifyRequest): string {
	for (const resolve of resolvers) {
		const bucket = resolve(request);

		if (bucket) {
			return bucket;
		}
	}

	return `ip:${request.ip}`;
}

/**
 * Builds the Redis client used for rate limit counters.
 *
 * Deliberately not the shared client from `config/redis`: that one is created
 * with `maxRetriesPerRequest: null`, which makes commands queue indefinitely
 * while Redis is unreachable instead of failing. A queued command would hang
 * the request without ever triggering `skipOnError`, so the limiter gets its
 * own fail-fast connection.
 */
function createRateLimitRedis(): Redis {
	return new Redis(env.REDIS_URL, {
		connectTimeout: 500,
		maxRetriesPerRequest: 1,
		enableOfflineQueue: false,
	});
}

/**
 * Registers global rate limiting backed by Redis.
 *
 * Counters live in Redis so every instance shares the same budget. Routes that
 * need a different policy override it with `config.rateLimit` in their own
 * definition rather than changing this default.
 *
 * @param fastify - The Fastify instance
 */
export async function setupRateLimit(fastify: FastifyInstance) {
	await fastify.register(fastifyRateLimit, {
		global: true,
		redis: createRateLimitRedis(),
		nameSpace: NAMESPACE,
		timeWindow: DEFAULT_TIME_WINDOW,
		max: DEFAULT_MAX_REQUESTS,
		keyGenerator,
		/** A Redis failure must never turn into a 500 for an otherwise valid request. */
		skipOnError: true,
		errorResponseBuilder: (_request, context) =>
			apiResponse({
				status: 429,
				error: "Too Many Requests",
				code: "rate_limit_exceeded",
				message: `Rate limit exceeded. Retry in ${context.after}.`,
				data: {
					limit: context.max,
					retry_after_ms: context.ttl,
				},
			}),
	});
}
