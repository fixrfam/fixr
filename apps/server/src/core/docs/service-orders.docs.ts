import {
	serviceOrderItemSelectSchema,
	serviceOrderSelectSchema,
} from "@fixr/db/schema";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import { deviceStatuses } from "@fixr/schemas/devices";
import {
	addServiceOrderItemSchema,
	addServiceOrderPhotosSchema,
	changeServiceOrderStatusSchema,
	createServiceOrderSchema,
	getServiceOrdersQuerySchema,
	patchServiceOrderItemSchema,
	patchServiceOrderSchema,
	serviceOrderIdParamsSchema,
	serviceOrderItemParamsSchema,
	serviceOrderStatuses,
} from "@fixr/schemas/service-orders";
import { paginatedDataSchema } from "@fixr/schemas/utils";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import { companyScopedErrors, notFoundError } from "./responses";
import { zodResponseSchema } from "./types";

const createServiceOrderResponseDataSchema = z.object({
	id: z.string(),
	number: z.number().int(),
});

const relation = z.object({ id: z.string(), name: z.string() });

const serviceOrderListRecordSchema = z.object({
	...serviceOrderSelectSchema.shape,
	client: relation.extend({
		cpf: z.string(),
		phone: z.string().nullable(),
		email: z.string().nullable(),
	}),
	employee: relation,
	device: z.object({
		id: z.string(),
		imei: z.string().nullable(),
		serialNumber: z.string().nullable(),
		status: deviceStatuses,
	}),
	model: relation.extend({ slug: z.string(), imageUrl: z.string().nullable() }),
	deviceMaker: relation,
	deviceCategory: relation.extend({ slug: z.string() }).nullable(),
});

const serviceOrderDetailSchema = serviceOrderListRecordSchema.extend({
	photos: z.array(
		z.object({
			id: z.string(),
			imageUrl: z.string(),
			fileName: z.string(),
			description: z.string().nullable(),
			createdAt: z.coerce.date(),
		})
	),
	/** Every status the order went through, oldest first; the first entry is its opening. */
	history: z.array(
		z.object({
			id: z.string(),
			from: serviceOrderStatuses.nullable(),
			to: serviceOrderStatuses,
			note: z.string().nullable(),
			createdAt: z.coerce.date(),
			employee: relation.nullable(),
		})
	),
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
- \`query\`: search in device model, maker, IMEI, reported defect, or client name
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

The order gets the company's next number (\`number\`, shown as \`<SUBDOMAIN>-<number>\`, e.g. \`ACME-12\`) and is opened for a customer's device (\`deviceId\`, see \`/companies/:subdomain/devices\`); its owner becomes the order's client and the device moves to \`in_shop\`.

The \`company_id\` and \`employee_id\` are inferred from the authenticated employee session (\`req.user\`).
Photo uploads are assumed to have been completed beforehand via pre-signed URLs; this endpoint only persists metadata.

Rules:
- Only authenticated employees can create service orders.
- The \`subdomain\` in the URL must match the employee's company.
`,
	params: getCompanyNestedDataSchema,
	body: createServiceOrderSchema,
	response: {
		201: zodResponseSchema({
			status: 201,
			error: null,
			message: "Service order created successfully.",
			code: "create_service_order_success",
			data: createServiceOrderResponseDataSchema,
		}).describe("Service order created successfully."),
		400: z
			.union([
				zodResponseSchema({
					status: 400,
					error: "Bad Request",
					code: "upload_not_found",
					message:
						"One or more uploads were not found or do not belong to this company.",
					data: null,
				}),
				zodResponseSchema({
					status: 400,
					error: "Bad Request",
					code: "service_order_device_not_found",
					message: "The device does not exist in this company.",
					data: null,
				}),
			])
			.describe("An upload or the device does not belong to this company."),
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
		404: companyScopedErrors[404],
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
const getServiceOrderSchema: FastifySchema = {
	tags: ["Service Orders"],
	summary: "Get service order",
	description: `
**Retrieves a service order** with its customer, device (model, maker, category), technician and photos.
`,
	params: serviceOrderParams,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Service order retrieved successfully.",
			code: "get_service_order_success",
			data: serviceOrderDetailSchema,
		}).describe("Service order retrieved successfully."),
		...companyScopedErrors,
		404: serviceOrderNotFound,
	},
	security: [{ JWT: [] }],
};

const patchServiceOrderSchemaDoc: FastifySchema = {
	tags: ["Service Orders"],
	summary: "Update service order",
	description: `
**Edits the reported issue and the notes of a service order.**
`,
	params: serviceOrderParams,
	body: patchServiceOrderSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Service order updated successfully.",
			code: "patch_service_order_success",
			data: serviceOrderDetailSchema,
		}).describe("Service order updated successfully."),
		...companyScopedErrors,
		404: serviceOrderNotFound,
	},
	security: [{ JWT: [] }],
};

const changeServiceOrderStatusSchemaDoc: FastifySchema = {
	tags: ["Service Orders"],
	summary: "Change service order status",
	description: `
**Moves a service order to another status.** The device follows it:

- \`ready\`: the device is \`ready_for_pickup\`
- \`delivered\`: the device is \`with_customer\`
- any other status: the device is \`in_shop\`

The change, with who made it and the optional \`note\`, is added to the order's \`history\`.
`,
	params: serviceOrderParams,
	body: changeServiceOrderStatusSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Service order status updated successfully.",
			code: "change_service_order_status_success",
			data: serviceOrderDetailSchema,
		}).describe("Service order status updated successfully."),
		...companyScopedErrors,
		404: serviceOrderNotFound,
	},
	security: [{ JWT: [] }],
};

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

const photoNotFound = notFoundError(
	"service_order_photo_not_found",
	"Photo not found in this service order."
);

const addServiceOrderPhotosSchemaDoc: FastifySchema = {
	tags: ["Service Orders"],
	summary: "Add photos to a service order",
	description: `
**Attaches photos to an open service order**, e.g. taken during the repair. Upload each file first through \`POST /uploads/service-orders/presign\` and send the upload ids.
`,
	params: serviceOrderParams,
	body: addServiceOrderPhotosSchema,
	response: {
		201: zodResponseSchema({
			status: 201,
			error: null,
			message: "Photos added to the service order.",
			code: "add_service_order_photos_success",
			data: serviceOrderDetailSchema,
		}).describe("Photos added to the service order."),
		400: zodResponseSchema({
			status: 400,
			error: "Bad Request",
			code: "upload_not_found",
			message:
				"One or more uploads were not found or do not belong to this company.",
			data: null,
		}).describe("An upload is missing, already used or from another company."),
		...companyScopedErrors,
		404: serviceOrderNotFound,
	},
	security: [{ JWT: [] }],
};

const deleteServiceOrderPhotoSchema: FastifySchema = {
	tags: ["Service Orders"],
	summary: "Remove a photo from a service order",
	params: serviceOrderParams.extend({ photoId: z.string().cuid2() }),
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Photo removed from the service order.",
			code: "delete_service_order_photo_success",
			data: serviceOrderDetailSchema,
		}).describe("Photo removed from the service order."),
		...companyScopedErrors,
		404: z.union([serviceOrderNotFound, photoNotFound]),
	},
	security: [{ JWT: [] }],
};

export const serviceOrdersDocs = {
	addServiceOrderPhotosSchema: addServiceOrderPhotosSchemaDoc,
	deleteServiceOrderPhotoSchema,
	getCompanyServiceOrdersSchema,
	createServiceOrderSchema: createServiceOrderSchemaDoc,
	getServiceOrderSchema,
	patchServiceOrderSchema: patchServiceOrderSchemaDoc,
	changeServiceOrderStatusSchema: changeServiceOrderStatusSchemaDoc,
	listServiceOrderItemsSchema,
	addServiceOrderItemSchema: addServiceOrderItemSchemaDoc,
	patchServiceOrderItemSchema: patchServiceOrderItemSchemaDoc,
	deleteServiceOrderItemSchema,
};
