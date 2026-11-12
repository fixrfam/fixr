import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import {
	createDeviceSchema,
	deviceIdParamsSchema,
	deviceStatuses,
	deviceStatusFor,
	getDevicesQuerySchema,
	patchDeviceSchema,
} from "./devices";
import { issuePaths } from "./test-utils";

const validDevice = () => ({ customerId: createId(), modelId: createId() });

describe("deviceStatuses", () => {
	it("lists where a device can be", () => {
		expect(deviceStatuses.options).toEqual([
			"in_shop",
			"ready_for_pickup",
			"with_customer",
		]);
	});
});

describe("createDeviceSchema", () => {
	it("accepts the owner and model, trimming the identifiers", () => {
		expect(
			createDeviceSchema.parse({ ...validDevice(), imei: " 35693803 " }).imei
		).toBe("35693803");
	});

	it.each(["customerId", "modelId"])("requires %s", (field) => {
		const input: Record<string, unknown> = validDevice();
		delete input[field];

		expect(issuePaths(createDeviceSchema, input)).toEqual([field]);
	});

	it.each([
		["imei", 51],
		["serialNumber", 101],
		["notes", 1001],
	])("limits %s", (field, length) => {
		expect(
			issuePaths(createDeviceSchema, {
				...validDevice(),
				[field]: "x".repeat(length),
			})
		).toEqual([field]);
	});

	it("rejects an unknown status", () => {
		expect(
			issuePaths(createDeviceSchema, { ...validDevice(), status: "lost" })
		).toEqual(["status"]);
	});
});

describe("patchDeviceSchema", () => {
	it("never changes the owner", () => {
		expect(
			patchDeviceSchema.parse({ customerId: createId(), status: "in_shop" })
		).toEqual({ status: "in_shop" });
	});
});

describe("getDevicesQuerySchema and deviceIdParamsSchema", () => {
	it("parses filters and the page", () => {
		const customerId = createId();
		expect(
			getDevicesQuerySchema.parse({ page: "2", customerId, status: "in_shop" })
		).toMatchObject({ page: 2, customerId, status: "in_shop" });
		expect(
			issuePaths(getDevicesQuerySchema, { page: 1, sort: "name" })
		).toEqual(["sort"]);
	});

	it("requires a cuid2 device id", () => {
		expect(issuePaths(deviceIdParamsSchema, { deviceId: "Nope!" })).toEqual([
			"deviceId",
		]);
	});
});

describe("deviceStatusFor", () => {
	it.each([
		["pending", "in_shop"],
		["diagnosing", "in_shop"],
		["waiting_approval", "in_shop"],
		["approved", "in_shop"],
		["fixing", "in_shop"],
		["ready", "ready_for_pickup"],
		["delivered", "with_customer"],
	] as const)("an order %s leaves the device %s", (status, expected) => {
		expect(deviceStatusFor(status)).toBe(expected);
	});
});
