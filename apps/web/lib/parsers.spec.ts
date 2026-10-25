import { describe, expect, it } from "vitest";
import { getFiltersStateParser, getSortingStateParser } from "./parsers";

describe("getSortingStateParser", () => {
	const parser = getSortingStateParser(["name", "createdAt"]);

	it("parses a valid sorting state", () => {
		expect(parser.parse('[{"id":"name","desc":true}]')).toEqual([
			{ id: "name", desc: true },
		]);
	});

	it.each([
		["malformed JSON", "[{"],
		["a wrong shape", '[{"id":"name"}]'],
		["an unknown column", '[{"id":"password","desc":false}]'],
	])("rejects %s", (_label, value) => {
		expect(parser.parse(value)).toBeNull();
	});

	it("accepts any column without an allowlist, and a Set allowlist", () => {
		expect(
			getSortingStateParser().parse('[{"id":"x","desc":false}]')
		).toHaveLength(1);
		expect(
			getSortingStateParser(new Set(["x"])).parse('[{"id":"x","desc":false}]')
		).toHaveLength(1);
	});

	it("round-trips and compares states", () => {
		const state = [{ id: "name", desc: false }];

		expect(parser.parse(parser.serialize(state as never))).toEqual(state);
		expect(
			parser.eq(state as never, [{ id: "name", desc: false }] as never)
		).toBe(true);
		expect(
			parser.eq(state as never, [{ id: "name", desc: true }] as never)
		).toBe(false);
		expect(parser.eq(state as never, [] as never)).toBe(false);
	});
});

describe("getFiltersStateParser", () => {
	const parser = getFiltersStateParser(["status"]);
	const valid = [
		{
			id: "status",
			value: "fixing",
			variant: "select",
			operator: "eq",
			filterId: "f1",
		},
	];

	it("parses a valid filter state", () => {
		expect(parser.parse(JSON.stringify(valid))).toEqual(valid);
	});

	it.each([
		["malformed JSON", "{"],
		[
			"an unknown operator",
			JSON.stringify([{ ...valid[0], operator: "drop" }]),
		],
		["an unknown column", JSON.stringify([{ ...valid[0], id: "secret" }])],
	])("rejects %s", (_label, value) => {
		expect(parser.parse(value)).toBeNull();
	});

	it("compares filter states", () => {
		expect(parser.eq(valid as never, [...valid] as never)).toBe(true);
		expect(
			parser.eq(valid as never, [{ ...valid[0], value: "x" }] as never)
		).toBe(false);
	});
});
