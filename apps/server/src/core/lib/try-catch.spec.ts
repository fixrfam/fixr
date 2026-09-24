import { describe, expect, it } from "vitest";
import { tryCatch } from "./try-catch";

describe("tryCatch", () => {
	it("returns data and a null error when the promise resolves", async () => {
		expect(await tryCatch(Promise.resolve(42))).toEqual({
			data: 42,
			error: null,
		});
	});

	it("returns the error and null data when the promise rejects", async () => {
		const error = new Error("boom");

		expect(await tryCatch(Promise.reject(error))).toEqual({
			data: null,
			error,
		});
	});

	it("keeps non-Error rejections as is", async () => {
		expect(await tryCatch(Promise.reject("nope"))).toEqual({
			data: null,
			error: "nope",
		});
	});

	it("does not catch synchronous throws that happen before the promise exists", () => {
		const build = (): Promise<never> => {
			throw new Error("sync");
		};

		expect(() => tryCatch(build())).toThrow("sync");
	});
});
