import {
	estimateItemSelectSchema,
	estimateSelectSchema,
} from "@fixr/db/schema";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	createEstimateSchema,
	estimateIdParamsSchema,
	estimateStatuses,
	estimateTokenParamsSchema,
	getEstimatesQuerySchema,
	patchEstimateSchema,
	rejectEstimateSchema,
	sendEstimateSchema,
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

/** The link token hash never leaves the server. */
const { publicTokenHash: _hash, ...estimateShape } = estimateSelectSchema.shape;

const estimateRecordSchema = z.object({
	...estimateShape,
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

const expiredError = zodResponseSchema({
	status: 410,
	error: "Gone",
	code: "estimate_expired",
	message: "The estimate's validity date has passed.",
	data: null,
}).describe("The validity date has passed.");

const sendEstimateSchemaDoc: FastifySchema = {
	tags: ["Estimates"],
	summary: "Send estimate to the client",
	description: `
**Emails the estimate to the client, with the PDF attached and a link to approve or reject it.**

- \`email\` defaults to the client's email; it is required when the client has none (\`400 estimate_no_recipient\`).
- Works on a \`draft\` or an already \`sent\` estimate. Sending again issues a new link and the previous one stops working.
- The estimate becomes \`sent\` and its service order moves to \`waiting_approval\` (only when the order has not gone past that point).
- The email is queued; the worker delivers it.
`,
	params: estimateParams,
	body: sendEstimateSchema,
	response: {
		200: detailResponse(
			200,
			"send_estimate_success",
			"Estimate sent to the client."
		),
		400: zodResponseSchema({
			status: 400,
			error: "Bad Request",
			code: "estimate_no_recipient",
			message:
				"The client has no email. Send the estimate to an email address.",
			data: null,
		}).describe("No email to send to."),
		409: conflictError(
			"estimate_invalid_transition",
			"The estimate can't move to this status from its current one."
		),
		410: expiredError,
		...companyScopedErrors,
		404: estimateNotFound,
	},
	security: [{ JWT: [] }],
};

const linkNotFound = notFoundError(
	"estimate_link_invalid",
	"This estimate link is invalid or was replaced."
);

const publicEstimateSchema = z.object({
	number: z.number(),
	status: estimateStatuses,
	validUntil: z.coerce.date(),
	expired: z.boolean(),
	discountPercentage: z.number(),
	notes: z.string().nullable(),
	sentAt: z.coerce.date().nullable(),
	respondedAt: z.coerce.date().nullable(),
	rejectionReason: z.string().nullable(),
	company: z.object({
		name: z.string(),
		email: z.string().nullable(),
		phone: z.string().nullable(),
		website: z.string().nullable(),
		logoUrl: z.string().nullable(),
	}),
	client: z.object({ name: z.string() }).nullable(),
	device: z.object({
		maker: z.string(),
		model: z.string(),
		reportedDefect: z.string(),
	}),
	items: z.array(
		z.object({
			type: z.enum(["part", "service"]),
			name: z.string(),
			quantity: z.number(),
			unitPrice: z.number(),
			total: z.number(),
		})
	),
	totals: totalsSchema,
});

const publicResponse = (code: string, message: string) =>
	zodResponseSchema({
		status: 200,
		error: null,
		code,
		message,
		data: publicEstimateSchema,
	}).describe(message);

const getPublicEstimateSchema: FastifySchema = {
	tags: ["Estimates"],
	summary: "View estimate from its link",
	description: `
**Public: what the client sees when opening the link from the email.**

No authentication: the token in the URL is the credential. It only exposes the estimate itself (company contact data, client name, device, items and totals), never internal ids.
`,
	params: estimateTokenParamsSchema,
	response: {
		200: publicResponse(
			"get_estimate_success",
			"Estimate retrieved successfully."
		),
		404: linkNotFound,
	},
};

const getPublicEstimatePdfSchema: FastifySchema = {
	tags: ["Estimates"],
	summary: "Download estimate PDF from its link",
	description:
		"**Public:** the same PDF sent by email (`application/pdf`, inline).",
	params: estimateTokenParamsSchema,
	response: { 404: linkNotFound },
};

const answerErrors = {
	404: linkNotFound,
	409: conflictError(
		"estimate_already_answered",
		"The estimate was already approved or rejected."
	),
	410: expiredError,
};

const approvePublicEstimateSchema: FastifySchema = {
	tags: ["Estimates"],
	summary: "Approve estimate from its link",
	description: `
**Public: the client approves the estimate.**

The estimate becomes \`approved\` and its service order moves to \`approved\` (only when the order has not gone past that point). Only a \`sent\`, unexpired estimate can be answered.
`,
	params: estimateTokenParamsSchema,
	response: {
		200: publicResponse("approve_estimate_success", "Answer recorded."),
		...answerErrors,
	},
};

const rejectPublicEstimateSchema: FastifySchema = {
	tags: ["Estimates"],
	summary: "Reject estimate from its link",
	description: `
**Public: the client rejects the estimate**, optionally with a reason the staff sees.

Only a \`sent\`, unexpired estimate can be answered. The service order keeps its status.
`,
	params: estimateTokenParamsSchema,
	body: rejectEstimateSchema,
	response: {
		200: publicResponse("reject_estimate_success", "Answer recorded."),
		...answerErrors,
	},
};

export const estimatesDocs = {
	listEstimatesSchema,
	getEstimateSchema,
	getEstimatePdfSchema,
	createEstimateSchema: createEstimateSchemaDoc,
	patchEstimateSchema: patchEstimateSchemaDoc,
	updateEstimateStatusSchema: updateEstimateStatusSchemaDoc,
	deleteEstimateSchema,
	sendEstimateSchema: sendEstimateSchemaDoc,
	getPublicEstimateSchema,
	getPublicEstimatePdfSchema,
	approvePublicEstimateSchema,
	rejectPublicEstimateSchema,
};
