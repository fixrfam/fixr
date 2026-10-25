import { describe, expect, it } from "vitest";
import { apiResponse, httpStatusCodes, paginatedData } from "./response";

describe("apiResponse", () => {
	it("returns exactly the envelope fields", () => {
		const body = apiResponse({
			status: 200,
			error: null,
			message: "ok",
			code: "ok",
			data: { a: 1 },
			// @ts-expect-error extra keys are dropped
			extra: true,
		});

		expect(body).toEqual({
			status: 200,
			error: null,
			message: "ok",
			code: "ok",
			data: { a: 1 },
		});
	});

	it("builds an error envelope", () => {
		expect(
			apiResponse({
				status: 404,
				error: "Not Found",
				message: "missing",
				code: "not_found",
				data: null,
			})
		).toMatchObject({ status: 404, error: "Not Found", data: null });
	});
});

describe("paginatedData", () => {
	it("returns records and pagination only", () => {
		const pagination = {
			total_records: 1,
			total_pages: 1,
			current_page: 1,
			next_page: null,
			prev_page: null,
		};

		expect(paginatedData({ records: [1], pagination })).toEqual({
			records: [1],
			pagination,
		});
	});
});

describe("httpStatusCodes", () => {
	it.each([
		[400, "Bad Request"],
		[401, "Unauthorized"],
		[403, "Forbidden"],
		[404, "Not Found"],
		[409, "Conflict"],
		[416, "Range Not Satisfiable"],
		[500, "Internal Server Error"],
	])("maps %i to %s", (status, text) => {
		expect(httpStatusCodes[status]).toBe(text);
	});
});
