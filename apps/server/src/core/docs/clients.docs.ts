import { clientSelectSchema } from "@fixr/db/schema";
import {
	clientIdParamsSchema,
	createClientSchema,
	getClientsQuerySchema,
	patchClientSchema,
} from "@fixr/schemas/clients";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
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

const clientRecordSchema = z.object(clientSelectSchema.shape);

const clientDetailSchema = z.object({
	...clientSelectSchema.shape,
	serviceOrders: z.array(
		z.object({
			id: z.string(),
			number: z.number().int(),
			deviceId: z.string(),
			deviceModel: z.string(),
			status: serviceOrderStatuses,
			createdAt: z.coerce.date(),
		})
	),
});

const clientParams = getCompanyNestedDataSchema.extend(
	clientIdParamsSchema.shape
);

const clientNotFound = notFoundError("client_not_found", "Client not found.");

const cpfConflict = conflictError(
	"client_cpf_conflict",
	"A client with this CPF already exists in this company."
);

const invalidPhone = zodResponseSchema({
	status: 400,
	error: "Bad Request",
	code: "client_phone_invalid",
	message: "Phone numbers must have 10 or 11 digits.",
	data: null,
}).describe("Phone numbers must have 10 or 11 digits.");

const listClientsSchema: FastifySchema = {
	tags: ["Clients"],
	summary: "List clients",
	description: `
**Retrieves the company's clients (paginated)**

- \`query\`: search in name, CPF, phone or e-mail
- \`page\`, \`perPage\`, \`sort\` (\`newer\` | \`older\` | \`name\`)

Deleted clients are not listed.
`,
	params: getCompanyNestedDataSchema,
	querystring: getClientsQuerySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Clients retrieved successfully.",
			code: "list_clients_success",
			data: paginatedDataSchema(clientRecordSchema),
		}).describe("Clients retrieved successfully."),
		416: pageOutOfBoundsError,
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const getClientSchema: FastifySchema = {
	tags: ["Clients"],
	summary: "Get client",
	description: `
**Retrieves a client with their 20 latest service orders in this company.**
`,
	params: clientParams,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Client retrieved successfully.",
			code: "get_client_success",
			data: clientDetailSchema,
		}).describe("Client retrieved successfully."),
		...companyScopedErrors,
		404: clientNotFound,
	},
	security: [{ JWT: [] }],
};

const createClientSchemaDoc: FastifySchema = {
	tags: ["Clients"],
	summary: "Create client",
	description: `
**Registers a client in the authenticated company**

- CPF and phones are stored with digits only; the CPF is unique within the company.
- Creating a client with the CPF of a deleted one restores that record (and its history) with the new data.
`,
	params: getCompanyNestedDataSchema,
	body: createClientSchema,
	response: {
		201: zodResponseSchema({
			status: 201,
			error: null,
			message: "Client created successfully.",
			code: "create_client_success",
			data: clientRecordSchema,
		}).describe("Client created successfully."),
		400: invalidPhone,
		409: cpfConflict,
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const patchClientSchemaDoc: FastifySchema = {
	tags: ["Clients"],
	summary: "Update client",
	params: clientParams,
	body: patchClientSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Client updated successfully.",
			code: "patch_client_success",
			data: clientRecordSchema,
		}).describe("Client updated successfully."),
		400: invalidPhone,
		409: cpfConflict,
		...companyScopedErrors,
		404: clientNotFound,
	},
	security: [{ JWT: [] }],
};

const deleteClientSchema: FastifySchema = {
	tags: ["Clients"],
	summary: "Delete client",
	description: `
**Soft deletes a client.** Their service orders are kept.
`,
	params: clientParams,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Client deleted successfully.",
			code: "delete_client_success",
			data: null,
		}).describe("Client deleted successfully."),
		...companyScopedErrors,
		404: clientNotFound,
	},
	security: [{ JWT: [] }],
};

export const clientsDocs = {
	listClientsSchema,
	getClientSchema,
	createClientSchema: createClientSchemaDoc,
	patchClientSchema: patchClientSchemaDoc,
	deleteClientSchema,
};
