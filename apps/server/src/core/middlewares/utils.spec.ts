import { describe, expect, it } from "vitest";
import { isFastifyError } from "./utils";

describe("isFastifyError", () => {
	it("recognizes objects with string code and name", () => {
		const error = Object.assign(new Error("x"), {
			code: "FST_JWT_NO_AUTHORIZATION_IN_COOKIE",
		});

		expect(isFastifyError(error)).toBe(true);
	});

	it.each([
		["null", null],
		["a string", "error"],
		["an Error without code", new Error("x")],
		["a numeric code", { code: 1, name: "x" }],
	])("rejects %s", (_label, value) => {
		expect(isFastifyError(value)).toBe(false);
	});
});
