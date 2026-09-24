import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import {
	createServiceOrderMockSchema,
	getServiceOrdersQuerySchema,
	serviceOrderStatuses,
} from "./service-orders";
import { issuePaths } from "./test-utils";

const validOrder = () => ({
	clientId: createId(),
	deviceBrandId: createId(),
	deviceCategoryId: createId(),
	deviceModel: "iPhone 12",
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

describe("createServiceOrderMockSchema", () => {
	it("accepts a valid order and defaults photos to []", () => {
		const result = createServiceOrderMockSchema.parse(validOrder());

		expect(result.photos).toEqual([]);
	});

	it.each([
		"clientId",
		"deviceBrandId",
		"deviceCategoryId",
		"deviceModel",
		"reportedDefect",
	])("requires %s", (field) => {
		const input: Record<string, unknown> = validOrder();
		delete input[field];

		expect(issuePaths(createServiceOrderMockSchema, input)).toEqual([field]);
	});

	it("rejects ids that are not cuid2", () => {
		expect(
			issuePaths(createServiceOrderMockSchema, {
				...validOrder(),
				clientId: "Not-A-Cuid",
			})
		).toEqual(["clientId"]);
	});

	it("does not accept a status from the caller", () => {
		const result = createServiceOrderMockSchema.parse({
			...validOrder(),
			status: "delivered",
		});

		expect(result).not.toHaveProperty("status");
	});

	it("limits photos to 20", () => {
		const photos = Array.from({ length: 21 }, () => ({ uploadId: createId() }));

		expect(
			issuePaths(createServiceOrderMockSchema, { ...validOrder(), photos })
		).toEqual(["photos"]);
	});

	it("limits deviceModel to 100 chars and imei to 50", () => {
		expect(
			issuePaths(createServiceOrderMockSchema, {
				...validOrder(),
				deviceModel: "a".repeat(101),
				imei: "1".repeat(51),
			}).sort()
		).toEqual(["deviceModel", "imei"]);
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
