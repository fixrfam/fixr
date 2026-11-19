import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import {
	createSectorSchema,
	putStageOwnersSchema,
	setEmployeeSectorSchema,
} from "./sectors";
import { assignServiceOrderSchema } from "./service-orders";
import { issuePaths } from "./test-utils";

describe("createSectorSchema", () => {
	it("trims the name", () => {
		expect(createSectorSchema.parse({ name: "  Bancada  " })).toEqual({
			name: "Bancada",
		});
	});

	it.each(["", "   ", "x".repeat(81)])("rejects the name %j", (name) => {
		expect(issuePaths(createSectorSchema, { name })).toEqual(["name"]);
	});
});

describe("putStageOwnersSchema", () => {
	const stage = (status: string, sectorId: string | null = createId()) => ({
		status,
		sectorId,
		employeeId: null,
	});

	it("accepts one owner per stage, a sector or an employee or neither", () => {
		expect(
			putStageOwnersSchema.safeParse({
				stages: [
					stage("pending"),
					{ status: "fixing", sectorId: null, employeeId: createId() },
					stage("ready", null),
				],
			}).success
		).toBe(true);
	});

	it("refuses the same stage twice", () => {
		expect(
			issuePaths(putStageOwnersSchema, {
				stages: [stage("pending"), stage("pending")],
			})
		).toEqual(["stages"]);
	});

	it("refuses an unknown stage or an invalid id", () => {
		expect(
			issuePaths(putStageOwnersSchema, {
				stages: [stage("lost"), stage("ready", "not-an-id")],
			})
		).toEqual(["stages.0.status", "stages.1.sectorId"]);
	});
});

describe("setEmployeeSectorSchema", () => {
	it("accepts a sector or none", () => {
		expect(setEmployeeSectorSchema.safeParse({ sectorId: null }).success).toBe(
			true
		);
		expect(
			setEmployeeSectorSchema.safeParse({ sectorId: createId() }).success
		).toBe(true);
	});
});

describe("assignServiceOrderSchema", () => {
	it("requires both fields, each an id or null", () => {
		expect(
			assignServiceOrderSchema.safeParse({ sectorId: null, assigneeId: null })
				.success
		).toBe(true);
		expect(
			issuePaths(assignServiceOrderSchema, { sectorId: "Not An Id!" })
		).toEqual(["sectorId", "assigneeId"]);
	});
});
