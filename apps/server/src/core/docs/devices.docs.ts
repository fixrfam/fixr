import { deviceSelectSchema } from "@fixr/db/schema";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	createDeviceSchema,
	deviceIdParamsSchema,
	deviceStatuses,
	getDevicesQuerySchema,
	patchDeviceSchema,
} from "@fixr/schemas/devices";
import { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import { paginatedDataSchema } from "@fixr/schemas/utils";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import {
	companyScopedErrors,
	notFoundError,
	pageOutOfBoundsError,
} from "./responses";
import { zodResponseSchema } from "./types";

const relation = z.object({ id: z.string(), name: z.string() });

/** A device with its owner and catalog model. */
export const deviceRecordSchema = z.object({
	...deviceSelectSchema.shape,
	client: relation.extend({
		cpf: z.string(),
		phone: z.string().nullable(),
	}),
	model: relation.extend({ slug: z.string() }),
	maker: relation,
	category: relation.nullable(),
});

const deviceDetailSchema = deviceRecordSchema.extend({
	serviceOrders: z.array(
		z.object({
			id: z.string(),
			status: serviceOrderStatuses,
			reportedDefect: z.string(),
			createdAt: z.coerce.date(),
		})
	),
});

const deviceParams = getCompanyNestedDataSchema.extend(
	deviceIdParamsSchema.shape
);

const deviceNotFound = notFoundError("device_not_found", "Device not found.");

const invalidReference = zodResponseSchema({
	status: 400,
	error: "Bad Request",
	code: "device_client_not_found",
	message: "The customer does not exist in this company.",
	data: null,
}).describe(
	"The customer (`device_client_not_found`) or the model (`device_model_not_found`) can't be used by this company."
);

const listDevicesSchema: FastifySchema = {
	tags: ["Customer Devices"],
	summary: "List devices",
	description: `
**Retrieves the customers' devices (paginated)**

- \`query\`: search in model, maker, owner name, IMEI or serial number
- \`clientId\`: only the devices of one customer
- \`status\`: one of: ${deviceStatuses.options.join(", ")}
- \`page\`, \`perPage\`, \`sort\` (\`newer\` | \`older\` | \`updated\`)

Deleted devices are not listed.
`,
	params: getCompanyNestedDataSchema,
	querystring: getDevicesQuerySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Devices retrieved successfully.",
			code: "list_devices_success",
			data: paginatedDataSchema(deviceRecordSchema),
		}).describe("Devices retrieved successfully."),
		416: pageOutOfBoundsError,
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const getDeviceSchema: FastifySchema = {
	tags: ["Customer Devices"],
	summary: "Get device",
	description: `
**Retrieves a device with its 20 latest service orders.**
`,
	params: deviceParams,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Device retrieved successfully.",
			code: "get_device_success",
			data: deviceDetailSchema,
		}).describe("Device retrieved successfully."),
		...companyScopedErrors,
		404: deviceNotFound,
	},
	security: [{ JWT: [] }],
};

const createDeviceSchemaDoc: FastifySchema = {
	tags: ["Customer Devices"],
	summary: "Create device",
	description: `
**Registers a customer's device**

- \`modelId\` comes from the shared catalog or the company's own models (\`GET /companies/:subdomain/models\`).
- \`status\` defaults to \`with_customer\`; opening a service order moves the device to \`in_shop\`.
`,
	params: getCompanyNestedDataSchema,
	body: createDeviceSchema,
	response: {
		201: zodResponseSchema({
			status: 201,
			error: null,
			message: "Device created successfully.",
			code: "create_device_success",
			data: deviceRecordSchema,
		}).describe("Device created successfully."),
		400: invalidReference,
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const patchDeviceSchemaDoc: FastifySchema = {
	tags: ["Customer Devices"],
	summary: "Update device",
	description: `
**Updates a device's model, identifiers, notes or status.** The owner can't change.
`,
	params: deviceParams,
	body: patchDeviceSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Device updated successfully.",
			code: "patch_device_success",
			data: deviceRecordSchema,
		}).describe("Device updated successfully."),
		400: invalidReference,
		...companyScopedErrors,
		404: deviceNotFound,
	},
	security: [{ JWT: [] }],
};

const deleteDeviceSchema: FastifySchema = {
	tags: ["Customer Devices"],
	summary: "Delete device",
	description: `
**Soft deletes a device.** Its service orders are kept.
`,
	params: deviceParams,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Device deleted successfully.",
			code: "delete_device_success",
			data: null,
		}).describe("Device deleted successfully."),
		...companyScopedErrors,
		404: deviceNotFound,
	},
	security: [{ JWT: [] }],
};

export const devicesDocs = {
	listDevicesSchema,
	getDeviceSchema,
	createDeviceSchema: createDeviceSchemaDoc,
	patchDeviceSchema: patchDeviceSchemaDoc,
	deleteDeviceSchema,
};
