import {
	estimateItemSelectSchema,
	estimateSelectSchema,
} from "@fixr/db/schema";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	createEstimateSchema,
	estimateIdParamsSchema,
	estimateStatuses,
	getEstimatesQuerySchema,
	patchEstimateSchema,
	updateEstimateStatusSchema,
} from "@fixr/schemas/estimates";
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

const totalsSchema = z.object({
	parts: z.number(),
	services: z.number(),
	subtotal: z.number(),
	discount: z.number(),
	total: z.number(),
});

const estimateRecordSchema = z.object({
	...estimateSelectSchema.shape,
	client: z.object({ id: z.string(), name: z.string() }).nullable(),
	totals: totalsSchema,
});

const estimateDetailSchema = z.object({
	...estimateRecordSchema.shape,
	items: z.array(
		z.object({ ...estimateItemSelectSchema.shape, total: z.number() })
	),
});

const estimateParams = getCompanyNestedDataSchema.extend(
	estimateIdParamsSchema.shape
);

const estimateNotFound = notFoundError(
	"estimate_not_found",
	"Estimate not found."
);

const notEditable = conflictError(
	"estimate_not_editable",
	"Only draft estimates can be changed or deleted."
);

const detailResponse = (status: 200 | 201, code: string, message: string) =>
	zodResponseSchema({
		status,
		error: null,
		code,
		message,
		data: estimateDetailSchema,
	}).describe(message);

const listEstimatesSchema: FastifySchema = {
	tags: ["Estimates"],
	summary: "List estimates",
	description: `
**Retrieves the company's estimates (paginated, newest number first)**

Optional filters (query string):
- \`status\`: one of ${estimateStatuses.options.join(", ")}
- \`serviceOrderId\`: estimates of one service order
- \`query\`: client name or estimate number
- \`page\`, \`perPage\`, \`sort\` (\`newer\` | \`older\`)
`,
	params: getCompanyNestedDataSchema,
	querystring: getEstimatesQuerySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Estimates retrieved successfully.",
			code: "list_estimates_success",
			data: paginatedDataSchema(estimateRecordSchema),
		}).describe("Estimates retrieved successfully."),
		416: pageOutOfBoundsError,
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const getEstimateSchema: FastifySchema = {
	tags: ["Estimates"],
	summary: "Get estimate",
	description: "Estimate with its items, the client and the totals.",
	params: estimateParams,
	response: {
		200: detailResponse(
			200,
			"get_estimate_success",
			"Estimate retrieved successfully."
		),
		...companyScopedErrors,
		404: estimateNotFound,
	},
	security: [{ JWT: [] }],
};

const getEstimatePdfSchema: FastifySchema = {
	tags: ["Estimates"],
	summary: "Download estimate PDF",
	description: `
**Renders the estimate as an A4 PDF** (\`application/pdf\`, inline).

Printed in the requester's language (locale cookie, then \`Accept-Language\`), with the company profile (logo, contact data), the client, the device, the items and the totals.
`,
	params: estimateParams,
	response: {
		...companyScopedErrors,
		404: estimateNotFound,
	},
	security: [{ JWT: [] }],
};

const createEstimateSchemaDoc: FastifySchema = {
	tags: ["Estimates"],
	summary: "Create estimate",
	description: `
**Creates a draft estimate from a service order.**

- The parts and services of the order are copied (name, quantity and price), so later changes to the order or the catalog don't alter the estimate.
- \`number\` is sequential per company.
- \`validUntil\` defaults to 30 days from now and \`discountPercentage\` to 0.
`,
	params: getCompanyNestedDataSchema,
	body: createEstimateSchema,
	response: {
		201: detailResponse(
			201,
			"create_estimate_success",
			"Estimate created successfully."
		),
		400: zodResponseSchema({
			status: 400,
			error: "Bad Request",
			code: "estimate_service_order_empty",
			message:
				"Add parts or services to the service order before estimating it.",
			data: null,
		}).describe(
			"The service order has no items (or `estimate_service_order_not_found`)."
		),
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const patchEstimateSchemaDoc: FastifySchema = {
	tags: ["Estimates"],
	summary: "Update estimate",
	description: "Changes the discount, validity or notes of a draft estimate.",
	params: estimateParams,
	body: patchEstimateSchema,
	response: {
		200: detailResponse(
			200,
			"patch_estimate_success",
			"Estimate updated successfully."
		),
		409: notEditable,
		...companyScopedErrors,
		404: estimateNotFound,
	},
	security: [{ JWT: [] }],
};

const updateEstimateStatusSchemaDoc: FastifySchema = {
	tags: ["Estimates"],
	summary: "Change estimate status",
	description: `
**Moves the estimate along its lifecycle.**

- \`draft\` → \`sent\`
- \`sent\` → \`approved\`, \`rejected\` or back to \`draft\`
- \`rejected\` → \`draft\` (to revise it)

Any other move answers \`409 estimate_invalid_transition\`.
`,
	params: estimateParams,
	body: updateEstimateStatusSchema,
	response: {
		200: detailResponse(
			200,
			"update_estimate_status_success",
			"Estimate status updated successfully."
		),
		409: conflictError(
			"estimate_invalid_transition",
			"The estimate can't move to this status from its current one."
		),
		...companyScopedErrors,
		404: estimateNotFound,
	},
	security: [{ JWT: [] }],
};

const deleteEstimateSchema: FastifySchema = {
	tags: ["Estimates"],
	summary: "Delete estimate",
	description: "Deletes a draft estimate.",
	params: estimateParams,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			code: "delete_estimate_success",
			message: "Estimate deleted successfully.",
			data: null,
		}).describe("Estimate deleted successfully."),
		409: notEditable,
		...companyScopedErrors,
		404: estimateNotFound,
	},
	security: [{ JWT: [] }],
};

export const estimatesDocs = {
	listEstimatesSchema,
	getEstimateSchema,
	getEstimatePdfSchema,
	createEstimateSchema: createEstimateSchemaDoc,
	patchEstimateSchema: patchEstimateSchemaDoc,
	updateEstimateStatusSchema: updateEstimateStatusSchemaDoc,
	deleteEstimateSchema,
};
