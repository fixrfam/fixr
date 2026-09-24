import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CacheService } from "../service/cache-service";
import { Cached } from "./cached";
import { InvalidateCache } from "./invalidate-cache";

const store = new Map<string, unknown>();
const loadUser = vi.fn(async (id: string) => ({ id, loadedAt: Date.now() }));
const saveUser = vi.fn(async (_id: string) => "saved");
const failing = vi.fn(async () => {
	throw new Error("db down");
});
const events: string[] = [];

class Repo {
	@Cached({ ttl: 60, key: "user" })
	static async queryUser(id: string) {
		return await loadUser(id);
	}

	@Cached({ ttl: 30, key: "users:all" })
	static async queryAll() {
		return await loadUser("all");
	}

	@Cached({ ttl: 60, key: "broken" })
	static async queryBroken() {
		return await failing();
	}

	@InvalidateCache({ patterns: ["user:*", "users:*"] })
	static async updateUser(id: string) {
		events.push("write");
		return await saveUser(id);
	}

	@InvalidateCache({ patterns: ["user:*"] })
	static async failingWrite() {
		events.push("write");
		return await failing();
	}
}

describe("cache decorators", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => undefined);
		vi.spyOn(CacheService, "get").mockImplementation(
			async (key) => (store.get(key) ?? null) as never
		);
		vi.spyOn(CacheService, "set").mockImplementation(async (key, value) => {
			store.set(key, value);
		});
		vi.spyOn(CacheService, "invalidatePatterns").mockImplementation(
			async (patterns) => {
				events.push(`invalidate:${patterns.join(",")}`);
			}
		);
	});

	afterEach(() => {
		store.clear();
		events.length = 0;
		vi.restoreAllMocks();
		loadUser.mockClear();
		saveUser.mockClear();
	});

	describe("@Cached", () => {
		it("calls the method and stores the result on a miss", async () => {
			const user = await Repo.queryUser("u1");

			expect(loadUser).toHaveBeenCalledTimes(1);
			expect(CacheService.set).toHaveBeenCalledWith('user:["u1"]', user, 60);
		});

		it("returns the cached value without calling the method on a hit", async () => {
			const first = await Repo.queryUser("u1");
			const second = await Repo.queryUser("u1");

			expect(second).toEqual(first);
			expect(loadUser).toHaveBeenCalledTimes(1);
		});

		it("includes the arguments in the key", async () => {
			await Repo.queryUser("u1");
			await Repo.queryUser("u2");

			expect(loadUser).toHaveBeenCalledTimes(2);
			expect([...store.keys()]).toEqual(['user:["u1"]', 'user:["u2"]']);
		});

		it("uses the bare key prefix for argument-less methods", async () => {
			await Repo.queryAll();

			expect(CacheService.set).toHaveBeenCalledWith(
				"users:all",
				expect.anything(),
				30
			);
		});

		it("does not cache errors", async () => {
			await expect(Repo.queryBroken()).rejects.toThrow("db down");
			await expect(Repo.queryBroken()).rejects.toThrow("db down");

			expect(CacheService.set).not.toHaveBeenCalled();
			expect(failing).toHaveBeenCalledTimes(2);
		});

		it("keeps working when the cache is unavailable (get returns null)", async () => {
			vi.mocked(CacheService.get).mockResolvedValue(null);

			await Repo.queryUser("u1");
			await Repo.queryUser("u1");

			expect(loadUser).toHaveBeenCalledTimes(2);
		});
	});

	describe("@InvalidateCache", () => {
		it("invalidates the configured patterns after the write succeeds", async () => {
			const result = await Repo.updateUser("u1");

			expect(result).toBe("saved");
			expect(events).toEqual(["write", "invalidate:user:*,users:*"]);
		});

		it("does not invalidate when the write fails", async () => {
			await expect(Repo.failingWrite()).rejects.toThrow("db down");

			expect(events).toEqual(["write"]);
			expect(CacheService.invalidatePatterns).not.toHaveBeenCalled();
		});
	});
});
