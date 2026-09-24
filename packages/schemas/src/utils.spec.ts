import { describe, expect, it } from "vitest";
import { z } from "zod";
import { issuePaths } from "./test-utils";
import {
	apiResponseSchema,
	getPaginatedDataSchema,
	paginatedDataSchema,
} from "./utils";

describe("apiResponseSchema", () => {
	it("accepts the standard envelope with null error/data", () => {
		expect(
			apiResponseSchema.safeParse({
				status: 200,
				error: null,
				message: "ok",
				code: "ok",
				data: null,
			}).success
		).toBe(true);
	});

	it("requires status, message and code", () => {
		expect(
			issuePaths(apiResponseSchema, { error: null, data: null }).sort()
		).toEqual(["code", "message", "status"]);
	});
});

describe("getPaginatedDataSchema", () => {
	it("coerces query-string numbers", () => {
		expect(getPaginatedDataSchema.parse({ page: "2", perPage: "25" })).toEqual({
			page: 2,
			perPage: 25,
		});
	});

	it("requires page >= 1", () => {
		expect(issuePaths(getPaginatedDataSchema, { page: "0" })).toEqual(["page"]);
		expect(issuePaths(getPaginatedDataSchema, {})).toEqual(["page"]);
	});

	it("bounds perPage between 1 and 100", () => {
		expect(issuePaths(getPaginatedDataSchema, { page: 1, perPage: 0 })).toEqual(
			["perPage"]
		);
		expect(
			issuePaths(getPaginatedDataSchema, { page: 1, perPage: 101 })
		).toEqual(["perPage"]);
		expect(
			getPaginatedDataSchema.parse({ page: 1, perPage: 100 }).perPage
		).toBe(100);
	});

	it("rejects a non numeric page", () => {
		expect(issuePaths(getPaginatedDataSchema, { page: "abc" })).toEqual([
			"page",
		]);
	});

	it("only accepts newer/older as sort", () => {
		expect(
			issuePaths(getPaginatedDataSchema, { page: 1, sort: "name" })
		).toEqual(["sort"]);
	});

	it("does not trim the query string", () => {
		expect(getPaginatedDataSchema.parse({ page: 1, query: "  a " }).query).toBe(
			"  a "
		);
	});
});

describe("paginatedDataSchema", () => {
	const schema = paginatedDataSchema(z.object({ id: z.string() }));

	it("validates records against the given record schema", () => {
		const pagination = {
			total_records: 1,
			total_pages: 1,
			current_page: 1,
			next_page: null,
			prev_page: null,
		};

		expect(
			schema.safeParse({ records: [{ id: "a" }], pagination }).success
		).toBe(true);
		expect(issuePaths(schema, { records: [{ id: 1 }], pagination })).toEqual([
			"records.0.id",
		]);
	});
});
