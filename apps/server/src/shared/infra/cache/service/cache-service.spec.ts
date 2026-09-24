import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { redisMock } from "@/test/helpers/redis-mock";
import { CacheService } from "./cache-service";

describe("CacheService", () => {
	beforeEach(() => {
		vi.spyOn(console, "warn").mockImplementation(() => undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	describe("get", () => {
		it("returns the parsed value", async () => {
			redisMock.get.mockResolvedValueOnce(JSON.stringify({ a: 1 }));

			expect(await CacheService.get("k")).toEqual({ a: 1 });
		});

		it("returns null on a miss", async () => {
			redisMock.get.mockResolvedValueOnce(null);

			expect(await CacheService.get("k")).toBeNull();
		});

		it("fails open when Redis is down", async () => {
			redisMock.get.mockRejectedValueOnce(new Error("ECONNREFUSED"));

			expect(await CacheService.get("k")).toBeNull();
		});

		it("does not throw on corrupted JSON", async () => {
			redisMock.get.mockResolvedValueOnce("{not json");

			expect(await CacheService.get("k")).toBeNull();
		});
	});

	describe("set", () => {
		it("stores the serialized value with a TTL", async () => {
			await CacheService.set("k", { a: 1 }, 60);

			expect(redisMock.set).toHaveBeenCalledWith("k", '{"a":1}', "EX", 60);
		});

		it("does not throw when Redis is down", async () => {
			redisMock.set.mockRejectedValueOnce(new Error("down"));

			await expect(CacheService.set("k", 1, 60)).resolves.toBeUndefined();
		});
	});

	describe("del", () => {
		it("deletes the key and swallows Redis errors", async () => {
			await CacheService.del("k");
			expect(redisMock.del).toHaveBeenCalledWith("k");

			redisMock.del.mockRejectedValueOnce(new Error("down"));
			await expect(CacheService.del("k")).resolves.toBeUndefined();
		});
	});

	describe("scan", () => {
		it("iterates the cursor until Redis returns 0", async () => {
			redisMock.scan
				.mockResolvedValueOnce(["7", ["a", "b"]])
				.mockResolvedValueOnce(["0", ["c"]]);

			expect(await CacheService.scan("x:*")).toEqual(["a", "b", "c"]);
			expect(redisMock.scan).toHaveBeenNthCalledWith(
				1,
				"0",
				"MATCH",
				"x:*",
				"COUNT",
				100
			);
			expect(redisMock.scan).toHaveBeenNthCalledWith(
				2,
				"7",
				"MATCH",
				"x:*",
				"COUNT",
				100
			);
		});

		it("returns what it found so far when Redis fails", async () => {
			redisMock.scan
				.mockResolvedValueOnce(["7", ["a"]])
				.mockRejectedValueOnce(new Error("down"));

			expect(await CacheService.scan("x:*")).toEqual(["a"]);
		});
	});

	describe("invalidatePatterns", () => {
		it("deletes the union of every pattern's keys once", async () => {
			redisMock.scan
				.mockResolvedValueOnce(["0", ["a", "b"]])
				.mockResolvedValueOnce(["0", ["b", "c"]]);

			await CacheService.invalidatePatterns(["x:*", "y:*"]);

			expect(redisMock.del).toHaveBeenCalledTimes(1);
			expect(redisMock.del).toHaveBeenCalledWith(["a", "b", "c"]);
		});

		it("does not call DEL when nothing matches", async () => {
			await CacheService.invalidatePatterns(["x:*"]);

			expect(redisMock.del).not.toHaveBeenCalled();
		});

		it("fails open when DEL fails", async () => {
			redisMock.scan.mockResolvedValueOnce(["0", ["a"]]);
			redisMock.del.mockRejectedValueOnce(new Error("down"));

			await expect(
				CacheService.invalidatePatterns(["x:*"])
			).resolves.toBeUndefined();
		});
	});
});
