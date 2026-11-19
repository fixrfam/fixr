import { sectorSelectSchema } from "@fixr/db/schema";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	createSectorSchema,
	patchSectorSchema,
	putStageOwnersSchema,
	sectorEmployeeParamsSchema,
	sectorIdParamsSchema,
	setEmployeeSectorSchema,
} from "@fixr/schemas/sectors";
import { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import { companyScopedErrors, conflictError, notFoundError } from "./responses";
import { zodResponseSchema } from "./types";

const sectorsListSchema = z.array(
	z.object({
		...sectorSelectSchema.shape,
		employees: z.array(z.object({ id: z.string(), name: z.string() })),
	})
);

const stageOwnersListSchema = z.array(
	z.object({
		status: serviceOrderStatuses,
		sectorId: z.string().nullable(),
		employeeId: z.string().nullable(),
	})
);

const sectorParams = getCompanyNestedDataSchema.extend(
	sectorIdParamsSchema.shape
);

const sectorNotFound = notFoundError("sector_not_found", "Sector not found.");

const nameConflict = conflictError(
	"sector_name_conflict",
	"A sector with this name already exists in this company."
);

const sectorsResponse = (status: 200 | 201, code: string, message: string) =>
	zodResponseSchema({
		status,
		error: null,
		message,
		code,
		data: sectorsListSchema,
	}).describe(message);

const listSectorsSchema: FastifySchema = {
	tags: ["Sectors"],
	summary: "List sectors",
	description:
		"**The company's sectors, by name, each with its employees.** Every route that changes sectors answers with this list.",
	params: getCompanyNestedDataSchema,
	response: {
		200: sectorsResponse(
			200,
			"list_sectors_success",
			"Sectors retrieved successfully."
		),
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const createSectorSchemaDoc: FastifySchema = {
	tags: ["Sectors"],
	summary: "Create sector",
	params: getCompanyNestedDataSchema,
	body: createSectorSchema,
	response: {
		201: sectorsResponse(
			201,
			"create_sector_success",
			"Sector created successfully."
		),
		409: nameConflict,
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const patchSectorSchemaDoc: FastifySchema = {
	tags: ["Sectors"],
	summary: "Rename sector",
	params: sectorParams,
	body: patchSectorSchema,
	response: {
		200: sectorsResponse(
			200,
			"patch_sector_success",
			"Sector updated successfully."
		),
		409: nameConflict,
		...companyScopedErrors,
		404: sectorNotFound,
	},
	security: [{ JWT: [] }],
};

const deleteSectorSchema: FastifySchema = {
	tags: ["Sectors"],
	summary: "Delete sector",
	description:
		"Its employees and service orders are left without a sector, and the stages it owned without a default sector.",
	params: sectorParams,
	response: {
		200: sectorsResponse(
			200,
			"delete_sector_success",
			"Sector deleted successfully."
		),
		...companyScopedErrors,
		404: sectorNotFound,
	},
	security: [{ JWT: [] }],
};

const setEmployeeSectorSchemaDoc: FastifySchema = {
	tags: ["Sectors"],
	summary: "Move employee to a sector",
	description:
		'Sets the employee\'s own sector (their "my sector" pool); `null` leaves them without one.',
	params: getCompanyNestedDataSchema.extend(sectorEmployeeParamsSchema.shape),
	body: setEmployeeSectorSchema,
	response: {
		200: sectorsResponse(
			200,
			"set_employee_sector_success",
			"Employee moved to the sector successfully."
		),
		...companyScopedErrors,
		404: z.union([
			sectorNotFound,
			notFoundError(
				"sector_employee_not_found",
				"The employee does not exist in this company."
			),
		]),
	},
	security: [{ JWT: [] }],
};

const listStageOwnersSchema: FastifySchema = {
	tags: ["Sectors"],
	summary: "List stage owners",
	description:
		"**Who is responsible for each stage (status) of a service order by default.** A stage missing from the list has no default owner.",
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
	tags: ["Sectors"],
	summary: "Set stage owners",
	description: `
**Replaces the default owner of every stage.** When a service order is opened
(\`pending\`) or moves to a stage that has an owner, it goes to that sector's
pool and, when set, to that employee (to the employee's sector when the stage
names no sector). Stages left out, or with neither, have no default: the order
stays with whoever had it.
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
			code: "sector_stage_owner_invalid",
			message: "A stage's sector or employee does not exist in this company.",
			data: null,
		}).describe("A stage's sector or employee does not exist in this company."),
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

export const sectorsDocs = {
	listSectorsSchema,
	createSectorSchema: createSectorSchemaDoc,
	patchSectorSchema: patchSectorSchemaDoc,
	deleteSectorSchema,
	setEmployeeSectorSchema: setEmployeeSectorSchemaDoc,
	listStageOwnersSchema,
	putStageOwnersSchema: putStageOwnersSchemaDoc,
};
