import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import {
	changeServiceOrderStatusSchema,
	createServiceOrderSchema,
	getServiceOrdersQuerySchema,
	patchServiceOrderSchema,
	serviceOrderStatuses,
} from "./service-orders";
import { issuePaths } from "./test-utils";

const validOrder = () => ({
	deviceId: createId(),
	reportedDefect: "Tela quebrada",
});

describe("serviceOrderStatuses", () => {
	it("lists the lifecycle statuses in order", () => {
		expect(serviceOrderStatuses.options).toEqual([
			"pending",
			"diagnosing",
			"waiting_approval",
			"approved",
			"fixing",
			"ready",
			"delivered",
		]);
	});
});

describe("createServiceOrderSchema", () => {
	it("accepts a valid order and defaults photos to []", () => {
		const result = createServiceOrderSchema.parse(validOrder());

		expect(result.photos).toEqual([]);
	});

	it.each(["deviceId", "reportedDefect"])("requires %s", (field) => {
		const input: Record<string, unknown> = validOrder();
		delete input[field];

		expect(issuePaths(createServiceOrderSchema, input)).toEqual([field]);
	});

	it("rejects ids that are not cuid2", () => {
		expect(
			issuePaths(createServiceOrderSchema, {
				...validOrder(),
				deviceId: "Not-A-Cuid",
			})
		).toEqual(["deviceId"]);
	});

	it("does not accept a status from the caller", () => {
		const result = createServiceOrderSchema.parse({
			...validOrder(),
			status: "delivered",
		});

		expect(result).not.toHaveProperty("status");
	});

	it("limits photos to 20", () => {
		const photos = Array.from({ length: 21 }, () => ({ uploadId: createId() }));

		expect(
			issuePaths(createServiceOrderSchema, { ...validOrder(), photos })
		).toEqual(["photos"]);
	});

	it("refuses a blank reported issue", () => {
		expect(
			issuePaths(createServiceOrderSchema, {
				...validOrder(),
				reportedDefect: "  ",
			})
		).toEqual(["reportedDefect"]);
	});
});

describe("getServiceOrdersQuerySchema", () => {
	it("coerces pagination and dates from the query string", () => {
		const result = getServiceOrdersQuerySchema.parse({
			page: "1",
			dateFrom: "2024-01-01",
			dateTo: "2024-01-31",
		});

		expect(result.page).toBe(1);
		expect(result.dateFrom).toBeInstanceOf(Date);
	});

	it("rejects an invalid status", () => {
		expect(
			issuePaths(getServiceOrdersQuerySchema, { page: 1, status: "done" })
		).toEqual(["status"]);
	});

	it("rejects dateFrom after dateTo", () => {
		expect(
			issuePaths(getServiceOrdersQuerySchema, {
				page: 1,
				dateFrom: "2024-02-01",
				dateTo: "2024-01-01",
			})
		).toEqual(["dateTo"]);
	});

	it("rejects an unparseable date", () => {
		expect(
			issuePaths(getServiceOrdersQuerySchema, { page: 1, dateFrom: "nope" })
		).toEqual(["dateFrom"]);
	});

	it("rejects a non-cuid2 employee filter", () => {
		expect(
			issuePaths(getServiceOrdersQuerySchema, {
				page: 1,
				employeeId: "Not-A-Cuid",
			})
		).toEqual(["employeeId"]);
	});
});

describe("patchServiceOrderSchema", () => {
	it("accepts an empty patch and clears the notes with null", () => {
		expect(patchServiceOrderSchema.parse({})).toEqual({});
		expect(patchServiceOrderSchema.parse({ observations: null })).toEqual({
			observations: null,
		});
	});

	it("refuses a blank reported issue", () => {
		expect(
			issuePaths(patchServiceOrderSchema, { reportedDefect: "   " })
		).toEqual(["reportedDefect"]);
	});
});

describe("changeServiceOrderStatusSchema", () => {
	it("accepts a lifecycle status only", () => {
		expect(changeServiceOrderStatusSchema.parse({ status: "ready" })).toEqual({
			status: "ready",
		});
		expect(issuePaths(changeServiceOrderStatusSchema, { status: "x" })).toEqual(
			["status"]
		);
	});
});
