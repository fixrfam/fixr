import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import {
	addDepartmentMembersSchema,
	createDepartmentSchema,
	patchDepartmentSchema,
	putEmployeeDepartmentsSchema,
	putStageOwnersSchema,
} from "./departments";
import { assignServiceOrderSchema } from "./service-orders";
import { issuePaths } from "./test-utils";

describe("createDepartmentSchema", () => {
	it("trims the name", () => {
		expect(createDepartmentSchema.parse({ name: "  Bancada  " })).toEqual({
			name: "Bancada",
		});
	});

	it.each(["", "   ", "x".repeat(81)])("rejects the name %j", (name) => {
		expect(issuePaths(createDepartmentSchema, { name })).toEqual(["name"]);
	});
});

describe("patchDepartmentSchema", () => {
	it("changes the name, the leader or neither", () => {
		expect(patchDepartmentSchema.safeParse({}).success).toBe(true);
		expect(
			patchDepartmentSchema.safeParse({ leaderId: createId() }).success
		).toBe(true);
		expect(patchDepartmentSchema.safeParse({ leaderId: null }).success).toBe(
			true
		);
	});
});

describe("members", () => {
	it("adds at least one employee", () => {
		expect(issuePaths(addDepartmentMembersSchema, { employeeIds: [] })).toEqual(
			["employeeIds"]
		);
		expect(
			addDepartmentMembersSchema.safeParse({ employeeIds: [createId()] })
				.success
		).toBe(true);
	});

	it("sets an employee's departments, none included", () => {
		expect(
			putEmployeeDepartmentsSchema.safeParse({ departmentIds: [] }).success
		).toBe(true);
		expect(
			issuePaths(putEmployeeDepartmentsSchema, {
				departmentIds: ["Not An Id!"],
			})
		).toEqual(["departmentIds.0"]);
	});
});

describe("putStageOwnersSchema", () => {
	const stage = (
		status: string,
		assigneeMode = "pool",
		employeeId: string | null = null
	) => ({ status, departmentId: createId(), assigneeMode, employeeId });

	it("accepts the pool, the leader or an employee per stage", () => {
		expect(
			putStageOwnersSchema.safeParse({
				stages: [
					stage("pending"),
					stage("fixing", "leader"),
					stage("ready", "employee", createId()),
				],
			}).success
		).toBe(true);
	});

	it("requires the employee of an employee-mode stage", () => {
		expect(
			issuePaths(putStageOwnersSchema, { stages: [stage("ready", "employee")] })
		).toEqual(["stages.0.employeeId"]);
	});

	it("refuses the same stage twice", () => {
		expect(
			issuePaths(putStageOwnersSchema, {
				stages: [stage("pending"), stage("pending")],
			})
		).toEqual(["stages"]);
	});

	it("refuses an unknown stage or mode", () => {
		expect(
			issuePaths(putStageOwnersSchema, {
				stages: [stage("lost"), stage("ready", "everyone")],
			})
		).toEqual(["stages.0.status", "stages.1.assigneeMode"]);
	});
});

describe("assignServiceOrderSchema", () => {
	it("requires both fields, each an id or null", () => {
		expect(
			assignServiceOrderSchema.safeParse({
				departmentId: null,
				assigneeId: null,
			}).success
		).toBe(true);
		expect(
			issuePaths(assignServiceOrderSchema, { departmentId: "Not An Id!" })
		).toEqual(["departmentId", "assigneeId"]);
	});
});
