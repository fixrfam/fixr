import { vi } from "vitest";

/** Minimal ioredis stand-in: every command resolves as if the cache were empty. */
export const redisMock = {
	get: vi.fn(async (_key: string): Promise<string | null> => null),
	set: vi.fn(async (..._args: unknown[]): Promise<string | null> => "OK"),
	del: vi.fn(async (_keys: string | string[]) => 0),
	scan: vi.fn(
		async (..._args: unknown[]): Promise<[string, string[]]> => ["0", []]
	),
	ping: vi.fn(async () => "PONG"),
	quit: vi.fn(async () => "OK"),
	on: vi.fn(),
};
