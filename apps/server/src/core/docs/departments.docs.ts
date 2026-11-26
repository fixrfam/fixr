import { departmentSelectSchema } from "@fixr/db/schema";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	addDepartmentMembersSchema,
	createDepartmentSchema,
	departmentIdParamsSchema,
	departmentMemberParamsSchema,
	employeeDepartmentsParamsSchema,
	getDepartmentsQuerySchema,
	patchDepartmentSchema,
	putEmployeeDepartmentsSchema,
	putStageOwnersSchema,
	stageAssigneeModes,
} from "@fixr/schemas/departments";
import { employeeRoles } from "@fixr/schemas/roles";
import { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import { paginatedDataSchema } from "@fixr/schemas/utils";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import {
	companyScopedErrors,
	conflictError,
	notFoundError,
	pageOutOfBoundsError,
} from "./responses";
import { zodResponseSchema } from "./types";

const person = z.object({ id: z.string(), name: z.string(), cpf: z.string() });

const departmentRecordSchema = z.object({
	...departmentSelectSchema.shape,
	leader: person.nullable(),
});

const departmentListRecordSchema = departmentRecordSchema.extend({
	membersCount: z.number().int(),
});

const departmentDetailSchema = departmentRecordSchema.extend({
	members: z.array(
		person.extend({ role: employeeRoles, addedAt: z.coerce.date() })
	),
});

const stageOwnersListSchema = z.array(
	z.object({
		status: serviceOrderStatuses,
		departmentId: z.string(),
		assigneeMode: stageAssigneeModes,
		employeeId: z.string().nullable(),
	})
);

const departmentParams = getCompanyNestedDataSchema.extend(
	departmentIdParamsSchema.shape
);

const departmentNotFound = notFoundError(
	"department_not_found",
	"Department not found."
);

const employeeNotFound = notFoundError(
	"department_employee_not_found",
	"The employee does not exist in this company."
);

const nameConflict = conflictError(
	"department_name_conflict",
	"A department with this name already exists in this company."
);

const detailResponse = (status: 200 | 201, code: string, message: string) =>
	zodResponseSchema({
		status,
		error: null,
		message,
		code,
		data: departmentDetailSchema,
	}).describe(message);

const listDepartmentsSchema: FastifySchema = {
	tags: ["Departments"],
	summary: "List departments",
	description: `
**The company's departments (paginated), with their leader and member count.**

- \`query\`: search by name
- \`page\`, \`perPage\`, \`sort\` (\`name\` | \`newer\` | \`older\`)
`,
	params: getCompanyNestedDataSchema,
	querystring: getDepartmentsQuerySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Departments retrieved successfully.",
			code: "list_departments_success",
			data: paginatedDataSchema(departmentListRecordSchema),
		}).describe("Departments retrieved successfully."),
		416: pageOutOfBoundsError,
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const getDepartmentSchema: FastifySchema = {
	tags: ["Departments"],
	summary: "Get department",
	description: "**The department with its leader and members, by name.**",
	params: departmentParams,
	response: {
		200: detailResponse(
			200,
			"get_department_success",
			"Department retrieved successfully."
		),
		...companyScopedErrors,
		404: departmentNotFound,
	},
	security: [{ JWT: [] }],
};

const createDepartmentSchemaDoc: FastifySchema = {
	tags: ["Departments"],
	summary: "Create department",
	params: getCompanyNestedDataSchema,
	body: createDepartmentSchema,
	response: {
		201: detailResponse(
			201,
			"create_department_success",
			"Department created successfully."
		),
		409: nameConflict,
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const patchDepartmentSchemaDoc: FastifySchema = {
	tags: ["Departments"],
	summary: "Update department",
	description:
		"Renames the department and/or sets its leader, who must be one of its members (`null`: no leader).",
	params: departmentParams,
	body: patchDepartmentSchema,
	response: {
		200: detailResponse(
			200,
			"patch_department_success",
			"Department updated successfully."
		),
		400: zodResponseSchema({
			status: 400,
			error: "Bad Request",
			code: "department_leader_not_member",
			message: "The leader must be a member of the department.",
			data: null,
		}).describe("The leader must be a member of the department."),
		409: nameConflict,
		...companyScopedErrors,
		404: departmentNotFound,
	},
	security: [{ JWT: [] }],
};

const deleteDepartmentSchema: FastifySchema = {
	tags: ["Departments"],
	summary: "Delete department",
	description:
		"Its members and stage defaults go with it; its service orders are left without a department.",
	params: departmentParams,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Department deleted successfully.",
			code: "delete_department_success",
			data: null,
		}).describe("Department deleted successfully."),
		...companyScopedErrors,
		404: departmentNotFound,
	},
	security: [{ JWT: [] }],
};

const addDepartmentMembersSchemaDoc: FastifySchema = {
	tags: ["Departments"],
	summary: "Add employees to a department",
	description:
		"An employee can be in several departments; adding one already in it changes nothing.",
	params: departmentParams,
	body: addDepartmentMembersSchema,
	response: {
		200: detailResponse(
			200,
			"add_department_members_success",
			"Employees added to the department successfully."
		),
		...companyScopedErrors,
		404: z.union([departmentNotFound, employeeNotFound]),
	},
	security: [{ JWT: [] }],
};

const removeDepartmentMemberSchema: FastifySchema = {
	tags: ["Departments"],
	summary: "Remove an employee from a department",
	description: "If they led the department, it is left without a leader.",
	params: getCompanyNestedDataSchema.extend(departmentMemberParamsSchema.shape),
	response: {
		200: detailResponse(
			200,
			"remove_department_member_success",
			"Employee removed from the department successfully."
		),
		...companyScopedErrors,
		404: departmentNotFound,
	},
	security: [{ JWT: [] }],
};

const putEmployeeDepartmentsSchemaDoc: FastifySchema = {
	tags: ["Departments"],
	summary: "Set an employee's departments",
	description:
		"Replaces every department of the employee (`[]`: none). Departments they leave lose them as leader.",
	params: getCompanyNestedDataSchema.extend(
		employeeDepartmentsParamsSchema.shape
	),
	body: putEmployeeDepartmentsSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Employee departments updated successfully.",
			code: "put_employee_departments_success",
			data: z.array(z.object({ id: z.string(), name: z.string() })),
		}).describe("Employee departments updated successfully."),
		...companyScopedErrors,
		404: z.union([departmentNotFound, employeeNotFound]),
	},
	security: [{ JWT: [] }],
};

const listStageOwnersSchema: FastifySchema = {
	tags: ["Departments"],
	summary: "List stage owners",
	description:
		"**Which department receives a service order at each stage (status), and who inside it.** A stage missing from the list has no default.",
	params: getCompanyNestedDataSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Stage owners retrieved successfully.",
			code: "list_stage_owners_success",
			data: stageOwnersListSchema,
		}).describe("Stage owners retrieved successfully."),
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const putStageOwnersSchemaDoc: FastifySchema = {
	tags: ["Departments"],
	summary: "Set stage owners",
	description: `
**Replaces which department receives a service order at each stage.** When an
order is opened (\`pending\`) or moves to a stage listed here, it goes to that
department and, by \`assigneeMode\`:

- \`pool\`: to nobody in particular (the department's pool)
- \`leader\`: to the department's leader (the pool when it has none)
- \`employee\`: to \`employeeId\`, a member of the department

Stages left out have no default: the order stays with whoever had it.
`,
	params: getCompanyNestedDataSchema,
	body: putStageOwnersSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Stage owners updated successfully.",
			code: "put_stage_owners_success",
			data: stageOwnersListSchema,
		}).describe("Stage owners updated successfully."),
		400: zodResponseSchema({
			status: 400,
			error: "Bad Request",
			code: "department_stage_owner_invalid",
			message:
				"A stage's department does not exist in this company, or its employee is not a member of it.",
			data: null,
		}).describe("A stage's department or employee is invalid."),
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

export const departmentsDocs = {
	listDepartmentsSchema,
	getDepartmentSchema,
	createDepartmentSchema: createDepartmentSchemaDoc,
	patchDepartmentSchema: patchDepartmentSchemaDoc,
	deleteDepartmentSchema,
	addDepartmentMembersSchema: addDepartmentMembersSchemaDoc,
	removeDepartmentMemberSchema,
	putEmployeeDepartmentsSchema: putEmployeeDepartmentsSchemaDoc,
	listStageOwnersSchema,
	putStageOwnersSchema: putStageOwnersSchemaDoc,
};
