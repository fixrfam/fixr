import { serviceSelectSchema } from "@fixr/db/schema";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	createServiceSchema,
	getServicesQuerySchema,
	patchServiceSchema,
	serviceIdParamsSchema,
} from "@fixr/schemas/services";
import { paginatedDataSchema } from "@fixr/schemas/utils";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import {
	companyScopedErrors,
	notFoundError,
	pageOutOfBoundsError,
} from "./responses";
import { zodResponseSchema } from "./types";

const serviceRecordSchema = z.object({
	...serviceSelectSchema.shape,
	partIds: z.array(z.string()),
});

const serviceParams = getCompanyNestedDataSchema.extend(
	serviceIdParamsSchema.shape
);

const serviceNotFound = notFoundError(
	"service_not_found",
	"Service not found."
);

const partNotFound = zodResponseSchema({
	status: 400,
	error: "Bad Request",
	code: "service_part_not_found",
	message: "One or more parts do not exist in this company.",
	data: null,
}).describe("One or more parts do not exist in this company.");

const listServicesSchema: FastifySchema = {
	tags: ["Parts & Services"],
	summary: "List services",
	description: `
**Retrieves the repair services the company offers (paginated)**

Optional filters (query string):
- \`query\`: search in name or description
- \`deviceCategory\`: services that apply to this device category
- \`page\`, \`perPage\`, \`sort\` (\`newer\` | \`older\` | \`name\`)
`,
	params: getCompanyNestedDataSchema,
	querystring: getServicesQuerySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Services retrieved successfully.",
			code: "list_services_success",
			data: paginatedDataSchema(serviceRecordSchema),
		}).describe("Services retrieved successfully."),
		416: pageOutOfBoundsError,
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const getServiceSchema: FastifySchema = {
	tags: ["Parts & Services"],
	summary: "Get service",
	params: serviceParams,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Service retrieved successfully.",
			code: "get_service_success",
			data: serviceRecordSchema,
		}).describe("Service retrieved successfully."),
		...companyScopedErrors,
		404: serviceNotFound,
	},
	security: [{ JWT: [] }],
};

const createServiceSchemaDoc: FastifySchema = {
	tags: ["Parts & Services"],
	summary: "Create service",
	description: `
**Creates a repair service for the authenticated company**

\`partIds\` are the parts the service usually uses; every one must belong to the company.
`,
	params: getCompanyNestedDataSchema,
	body: createServiceSchema,
	response: {
		201: zodResponseSchema({
			status: 201,
			error: null,
			message: "Service created successfully.",
			code: "create_service_success",
			data: serviceRecordSchema,
		}).describe("Service created successfully."),
		400: partNotFound,
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const patchServiceSchemaDoc: FastifySchema = {
	tags: ["Parts & Services"],
	summary: "Update service",
	description: `
**Partially updates a service.** Sending \`partIds\` replaces the linked parts.
`,
	params: serviceParams,
	body: patchServiceSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Service updated successfully.",
			code: "patch_service_success",
			data: serviceRecordSchema,
		}).describe("Service updated successfully."),
		400: partNotFound,
		...companyScopedErrors,
		404: serviceNotFound,
	},
	security: [{ JWT: [] }],
};

const deleteServiceSchema: FastifySchema = {
	tags: ["Parts & Services"],
	summary: "Delete service",
	params: serviceParams,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Service deleted successfully.",
			code: "delete_service_success",
			data: null,
		}).describe("Service deleted successfully."),
		...companyScopedErrors,
		404: serviceNotFound,
	},
	security: [{ JWT: [] }],
};

export const servicesDocs = {
	listServicesSchema,
	getServiceSchema,
	createServiceSchema: createServiceSchemaDoc,
	patchServiceSchema: patchServiceSchemaDoc,
	deleteServiceSchema,
};
