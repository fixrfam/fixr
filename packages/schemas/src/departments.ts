import { i18nMessage } from "@fixr/i18n";
import { z } from "zod";
import { serviceOrderStatuses } from "./service-orders";
import { getPaginatedDataSchema } from "./utils";

const name = z
	.string()
	.trim()
	.min(1, i18nMessage("validation.name.required"))
	.max(80, i18nMessage("validation.name.atMost", { count: 80 }));

const employeeId = z
	.string()
	.cuid2({ message: i18nMessage("validation.serviceOrder.assigneeInvalid") });

/** @description Body schema for creating a department */
export const createDepartmentSchema = z.object({ name });

/** @description Body schema for renaming a department or changing its leader (null: none) */
export const patchDepartmentSchema = z.object({
	name: name.optional(),
	leaderId: employeeId.nullable().optional(),
});

/** @description Query schema for listing departments: pagination and search by name */
export const getDepartmentsQuerySchema = getPaginatedDataSchema.extend({
	sort: z.enum(["name", "newer", "older"]).optional(),
});

/** @description Params schema for routes that target a single department */
export const departmentIdParamsSchema = z.object({
	departmentId: z.string().cuid2(),
});

/** @description Params schema for routes that target a member of a department */
export const departmentMemberParamsSchema = departmentIdParamsSchema.extend({
	employeeId: z.string().cuid2(),
});

/** @description Body schema for adding employees to a department */
export const addDepartmentMembersSchema = z.object({
	employeeIds: z
		.array(employeeId)
		.min(1, i18nMessage("validation.department.membersRequired")),
});

/** @description Params schema for the routes about one employee's departments */
export const employeeDepartmentsParamsSchema = z.object({
	employeeId: z.string().cuid2(),
});

/** @description Body schema for setting every department of an employee (empty: none) */
export const putEmployeeDepartmentsSchema = z.object({
	departmentIds: z.array(
		z.string().cuid2({ message: i18nMessage("validation.department.invalid") })
	),
});

/**
 * Who gets an order when it enters a stage: the department's pool (nobody in
 * particular), the department's leader, or one employee of the department.
 */
export const stageAssigneeModes = z.enum(["pool", "leader", "employee"]);

/**
 * @description Body schema for setting which department receives a service
 * order at each stage, and who inside it. A stage left out has no default:
 * the order stays where it was.
 */
export const putStageOwnersSchema = z.object({
	stages: z
		.array(
			z
				.object({
					status: serviceOrderStatuses,
					departmentId: z
						.string()
						.cuid2({ message: i18nMessage("validation.department.invalid") }),
					assigneeMode: stageAssigneeModes,
					employeeId: employeeId.nullable(),
				})
				.refine(
					(stage) => stage.assigneeMode !== "employee" || stage.employeeId,
					{
						message: i18nMessage("validation.department.stageEmployeeRequired"),
						path: ["employeeId"],
					}
				)
		)
		.refine(
			(stages) =>
				new Set(stages.map((stage) => stage.status)).size === stages.length,
			{ message: i18nMessage("validation.department.stageRepeated") }
		),
});
