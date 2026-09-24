import { vi } from "vitest";

const CHAIN_METHODS = [
	"from",
	"where",
	"innerJoin",
	"leftJoin",
	"orderBy",
	"limit",
	"offset",
	"values",
	"set",
	"$dynamic",
	"$returningId",
] as const;

/**
 * Drizzle-like thenable query builder for services that query `db` directly.
 * Every `db.select()/insert()/update()/delete()` call consumes the next queued
 * result (FIFO); chained calls are recorded for assertions.
 */
export function createDbMock() {
	const results: unknown[] = [];
	const calls: { method: string; args: unknown[] }[] = [];

	const makeQuery = () => {
		const result = results.length > 0 ? results.shift() : [];
		const query: Record<string, unknown> = {
			// biome-ignore lint/suspicious/noThenProperty: mimics Drizzle's thenable builder
			then: (
				resolve: (value: unknown) => unknown,
				reject?: (e: unknown) => unknown
			) =>
				result instanceof Error
					? Promise.reject(result).then(resolve, reject)
					: Promise.resolve(result).then(resolve, reject),
		};
		for (const method of CHAIN_METHODS) {
			query[method] = (...args: unknown[]) => {
				calls.push({ method, args });
				return query;
			};
		}
		return query;
	};

	const db = {
		select: vi.fn(() => makeQuery()),
		insert: vi.fn(() => makeQuery()),
		update: vi.fn(() => makeQuery()),
		delete: vi.fn(() => makeQuery()),
	};

	return {
		db,
		calls,
		/** Queue the result of the next query (an Error makes it reject). */
		queue: (...values: unknown[]) => {
			results.push(...values);
		},
		reset: () => {
			results.length = 0;
			calls.length = 0;
			for (const fn of Object.values(db)) {
				fn.mockClear();
			}
		},
	};
}
