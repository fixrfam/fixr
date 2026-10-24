import {
	serviceOrderImageSelectSchema,
	serviceOrderItemSelectSchema,
	serviceOrderSelectSchema,
} from "@fixr/db/schema";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	addServiceOrderItemSchema,
	createServiceOrderMockSchema,
	getServiceOrdersQuerySchema,
	patchServiceOrderItemSchema,
	serviceOrderIdParamsSchema,
	serviceOrderItemParamsSchema,
	serviceOrderStatuses,
} from "@fixr/schemas/service-orders";
import { paginatedDataSchema } from "@fixr/schemas/utils";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import { companyScopedErrors, notFoundError } from "./responses";
import { zodResponseSchema } from "./types";

const createServiceOrderResponseDataSchema = serviceOrderSelectSchema.extend({
	photos: z.array(serviceOrderImageSelectSchema),
});

const serviceOrderListRecordSchema = z.object({
	...serviceOrderSelectSchema.shape,
	customer: z.object({
		id: z.string(),
		name: z.string(),
	}),
	employee: z.object({
		id: z.string(),
		name: z.string(),
	}),
	deviceCategory: z.object({
		id: z.string(),
		name: z.string(),
	}),
	deviceMaker: z.object({
		id: z.string(),
		name: z.string(),
	}),
});

const getCompanyServiceOrdersSchema: FastifySchema = {
	tags: ["Service Orders"],
	summary: "List service orders",
	description: `
**Retrieves company service orders (paginated)**

Optional filters (query string):
- \`deviceCategoryId\`: device category (cuid2)
- \`employeeId\`: responsible employee (cuid2)
- \`status\`: one of: ${serviceOrderStatuses.options.join(", ")}
- \`dateFrom\` / \`dateTo\`: filter by \`created_at\` (inclusive; ISO date or datetime)
- \`query\`: search in device model, reported defect, or customer name
- \`page\`, \`perPage\`, \`sort\` (\`newer\` | \`older\`): pagination (see API pagination docs)
`,
	params: getCompanyNestedDataSchema,
	querystring: getServiceOrdersQuerySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Company service orders successfully retrieved.",
			code: "get_company_service_orders_success",
			data: paginatedDataSchema(serviceOrderListRecordSchema),
		}).describe("Service orders retrieved successfully."),
		416: zodResponseSchema({
			status: 416,
			error: "Range Not Satisfiable",
			code: "page_out_of_bounds",
			message: "The requested page exceeds the total number of pages.",
			data: null,
		}).describe("Requested page exceeds total pages."),
		403: zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "not_allowed",
			message: "You are not authorized to access this company.",
			data: null,
		}).describe("Not allowed to access this company."),
		404: zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "company_not_found",
			message: "There's no companies bound to your account",
			data: null,
		}).describe("User is not associated with a company."),
	},
	security: [{ JWT: [] }],
};

const createServiceOrderSchemaDoc: FastifySchema = {
	tags: ["Service Orders"],
	summary: "Create service order",
	description: `
**Creates a new service order for the authenticated company**

The \`company_id\` and \`employee_id\` are inferred from the authenticated employee session (\`req.user\`).
Photo uploads are assumed to have been completed beforehand via pre-signed URLs; this endpoint only persists metadata.

Rules:
- Only authenticated employees can create service orders.
- The \`subdomain\` in the URL must match the employee's company.
`,
	params: getCompanyNestedDataSchema,
	body: createServiceOrderMockSchema,
	response: {
		201: zodResponseSchema({
			status: 201,
			error: null,
			message: "Service order created successfully.",
			code: "create_service_order_success",
			data: createServiceOrderResponseDataSchema,
		}).describe("Service order created successfully."),
		400: zodResponseSchema({
			status: 400,
			error: "Bad Request",
			code: "upload_not_found",
			message:
				"One or more uploads were not found or do not belong to this company.",
			data: null,
		}).describe("Upload was not found or does not belong to this company."),
		403: z
			.union([
				zodResponseSchema({
					status: 403,
					error: "Forbidden",
					code: "not_allowed",
					message: "You are not allowed to perform this action.",
					data: null,
				}),
				zodResponseSchema({
					status: 403,
					error: "Forbidden",
					code: "employee_not_found",
					message: "Employee profile not found for this account.",
					data: null,
				}),
			])
			.describe("User is not allowed to perform this action."),
		404: z
			.union([
				zodResponseSchema({
					status: 404,
					error: "Not Found",
					code: "company_not_found",
					message: "There's no companies bound to your account",
					data: null,
				}),
				zodResponseSchema({
					status: 404,
					error: "Not Found",
					code: "customer_not_found",
					message: "Customer not found.",
					data: null,
				}),
				zodResponseSchema({
					status: 404,
					error: "Not Found",
					code: "device_brand_not_found",
					message: "Device brand not found.",
					data: null,
				}),
				zodResponseSchema({
					status: 404,
					error: "Not Found",
					code: "device_category_not_found",
					message: "Device category not found.",
					data: null,
				}),
			])
			.describe("Referenced resource was not found."),
	},
	security: [{ JWT: [] }],
};

const serviceOrderItemsDataSchema = z.object({
	items: z.array(
		z.object({ ...serviceOrderItemSelectSchema.shape, total: z.number() })
	),
	totals: z.object({
		parts: z.number(),
		services: z.number(),
		total: z.number(),
	}),
});

const serviceOrderParams = getCompanyNestedDataSchema.extend(
	serviceOrderIdParamsSchema.shape
);
const serviceOrderItemParams = getCompanyNestedDataSchema.extend(
	serviceOrderItemParamsSchema.shape
);

const serviceOrderNotFound = notFoundError(
	"service_order_not_found",
	"Service order not found."
);
const itemNotFound = notFoundError(
	"service_order_item_not_found",
	"Item not found in this service order."
);

const itemsResponse = (status: 200 | 201, code: string, message: string) =>
	zodResponseSchema({
		status,
		error: null,
		code,
		message,
		data: serviceOrderItemsDataSchema,
	}).describe(message);

const listServiceOrderItemsSchema: FastifySchema = {
	tags: ["Service Orders"],
	summary: "List service order items",
	description: `
**Parts and services used on a service order**, each with its line total, plus the parts, services and overall totals.
`,
	params: serviceOrderParams,
	response: {
		200: itemsResponse(
			200,
			"list_service_order_items_success",
			"Service order items retrieved successfully."
		),
		...companyScopedErrors,
		404: serviceOrderNotFound,
	},
	security: [{ JWT: [] }],
};

const addServiceOrderItemSchemaDoc: FastifySchema = {
	tags: ["Service Orders"],
	summary: "Add an item to a service order",
	description: `
**Adds a catalog part or service to the service order.**

The item's name and price are copied from the catalog (\`unitPrice\` overrides the price), so later catalog changes don't alter the order. Answers with the updated item list and totals.
`,
	params: serviceOrderParams,
	body: addServiceOrderItemSchema,
	response: {
		201: itemsResponse(
			201,
			"add_service_order_item_success",
			"Item added to the service order."
		),
		400: zodResponseSchema({
			status: 400,
			error: "Bad Request",
			code: "service_order_catalog_item_not_found",
			message: "The part or service does not exist in this company.",
			data: null,
		}).describe("The part or service does not exist in this company."),
		...companyScopedErrors,
		404: serviceOrderNotFound,
	},
	security: [{ JWT: [] }],
};

const patchServiceOrderItemSchemaDoc: FastifySchema = {
	tags: ["Service Orders"],
	summary: "Update a service order item",
	description: "Changes the quantity or the unit price of an item.",
	params: serviceOrderItemParams,
	body: patchServiceOrderItemSchema,
	response: {
		200: itemsResponse(
			200,
			"patch_service_order_item_success",
			"Service order item updated."
		),
		...companyScopedErrors,
		404: itemNotFound,
	},
	security: [{ JWT: [] }],
};

const deleteServiceOrderItemSchema: FastifySchema = {
	tags: ["Service Orders"],
	summary: "Remove a service order item",
	params: serviceOrderItemParams,
	response: {
		200: itemsResponse(
			200,
			"delete_service_order_item_success",
			"Item removed from the service order."
		),
		...companyScopedErrors,
		404: itemNotFound,
	},
	security: [{ JWT: [] }],
};

export const serviceOrdersDocs = {
	getCompanyServiceOrdersSchema,
	createServiceOrderSchema: createServiceOrderSchemaDoc,
	listServiceOrderItemsSchema,
	addServiceOrderItemSchema: addServiceOrderItemSchemaDoc,
	patchServiceOrderItemSchema: patchServiceOrderItemSchemaDoc,
	deleteServiceOrderItemSchema,
};
