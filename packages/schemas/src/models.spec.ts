import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import {
	createModelBodySchema,
	createModelImageBodySchema,
	getModelsQuerySchema,
	modelStatuses,
	patchModelBodySchema,
} from "./models";
import { issuePaths } from "./test-utils";

describe("createModelBodySchema", () => {
	it("requires name and makerId", () => {
		expect(issuePaths(createModelBodySchema, {}).sort()).toEqual([
			"makerId",
			"name",
		]);
		expect(
			createModelBodySchema.safeParse({ name: "Galaxy", makerId: "m" }).success
		).toBe(true);
	});

	it("rejects an unknown status", () => {
		expect(
			issuePaths(createModelBodySchema, {
				name: "Galaxy",
				makerId: "m",
				status: "Beta",
			})
		).toEqual(["status"]);
	});

	it("keeps numeric spec fields numeric (no string coercion)", () => {
		expect(
			issuePaths(createModelBodySchema, {
				name: "Galaxy",
				makerId: "m",
				weightGrams: "180",
			})
		).toEqual(["weightGrams"]);
	});
});

describe("patchModelBodySchema", () => {
	it("accepts an empty patch", () => {
		expect(patchModelBodySchema.safeParse({}).success).toBe(true);
	});

	it("still validates provided fields", () => {
		expect(issuePaths(patchModelBodySchema, { name: "" })).toEqual(["name"]);
	});
});

describe("getModelsQuerySchema", () => {
	it("accepts filters and the name sort", () => {
		expect(
			getModelsQuerySchema.safeParse({
				page: "1",
				makerId: createId(),
				status: modelStatuses.enum.Available,
				sort: "name",
			}).success
		).toBe(true);
	});

	it("rejects a non-cuid2 maker filter", () => {
		expect(
			issuePaths(getModelsQuerySchema, { page: 1, makerId: "Not-A-Cuid" })
		).toEqual(["makerId"]);
	});
});

describe("createModelImageBodySchema", () => {
	it("requires uploadId and an integer position", () => {
		expect(issuePaths(createModelImageBodySchema, {})).toEqual(["uploadId"]);
		expect(
			issuePaths(createModelImageBodySchema, { uploadId: "u", position: 1.5 })
		).toEqual(["position"]);
	});
});
