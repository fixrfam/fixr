import { customerSelectSchema } from "@fixr/db/schema";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	createCustomerSchema,
	customerIdParamsSchema,
	getCustomersQuerySchema,
	patchCustomerSchema,
} from "@fixr/schemas/customers";
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

const customerRecordSchema = z.object(customerSelectSchema.shape);

const customerDetailSchema = z.object({
	...customerSelectSchema.shape,
	serviceOrders: z.array(
		z.object({
			id: z.string(),
			deviceModel: z.string(),
			status: serviceOrderStatuses,
			createdAt: z.coerce.date(),
		})
	),
});

const customerParams = getCompanyNestedDataSchema.extend(
	customerIdParamsSchema.shape
);

const customerNotFound = notFoundError(
	"customer_not_found",
	"Customer not found."
);

const cpfConflict = conflictError(
	"customer_cpf_conflict",
	"A customer with this CPF already exists in this company."
);

const invalidPhone = zodResponseSchema({
	status: 400,
	error: "Bad Request",
	code: "customer_phone_invalid",
	message: "Phone numbers must have 10 or 11 digits.",
	data: null,
}).describe("Phone numbers must have 10 or 11 digits.");

const listCustomersSchema: FastifySchema = {
	tags: ["Customers"],
	summary: "List customers",
	description: `
**Retrieves the company's customers (paginated)**

- \`query\`: search in name, CPF, phone or e-mail
- \`page\`, \`perPage\`, \`sort\` (\`newer\` | \`older\` | \`name\`)

Deleted customers are not listed.
`,
	params: getCompanyNestedDataSchema,
	querystring: getCustomersQuerySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Customers retrieved successfully.",
			code: "list_customers_success",
			data: paginatedDataSchema(customerRecordSchema),
		}).describe("Customers retrieved successfully."),
		416: pageOutOfBoundsError,
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const getCustomerSchema: FastifySchema = {
	tags: ["Customers"],
	summary: "Get customer",
	description: `
**Retrieves a customer with their 20 latest service orders in this company.**
`,
	params: customerParams,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Customer retrieved successfully.",
			code: "get_customer_success",
			data: customerDetailSchema,
		}).describe("Customer retrieved successfully."),
		...companyScopedErrors,
		404: customerNotFound,
	},
	security: [{ JWT: [] }],
};

const createCustomerSchemaDoc: FastifySchema = {
	tags: ["Customers"],
	summary: "Create customer",
	description: `
**Registers a customer in the authenticated company**

- CPF and phones are stored with digits only; the CPF is unique within the company.
- Creating a customer with the CPF of a deleted one restores that record (and its history) with the new data.
`,
	params: getCompanyNestedDataSchema,
	body: createCustomerSchema,
	response: {
		201: zodResponseSchema({
			status: 201,
			error: null,
			message: "Customer created successfully.",
			code: "create_customer_success",
			data: customerRecordSchema,
		}).describe("Customer created successfully."),
		400: invalidPhone,
		409: cpfConflict,
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const patchCustomerSchemaDoc: FastifySchema = {
	tags: ["Customers"],
	summary: "Update customer",
	params: customerParams,
	body: patchCustomerSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Customer updated successfully.",
			code: "patch_customer_success",
			data: customerRecordSchema,
		}).describe("Customer updated successfully."),
		400: invalidPhone,
		409: cpfConflict,
		...companyScopedErrors,
		404: customerNotFound,
	},
	security: [{ JWT: [] }],
};

const deleteCustomerSchema: FastifySchema = {
	tags: ["Customers"],
	summary: "Delete customer",
	description: `
**Soft deletes a customer.** Their service orders are kept.
`,
	params: customerParams,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Customer deleted successfully.",
			code: "delete_customer_success",
			data: null,
		}).describe("Customer deleted successfully."),
		...companyScopedErrors,
		404: customerNotFound,
	},
	security: [{ JWT: [] }],
};

export const customersDocs = {
	listCustomersSchema,
	getCustomerSchema,
	createCustomerSchema: createCustomerSchemaDoc,
	patchCustomerSchema: patchCustomerSchemaDoc,
	deleteCustomerSchema,
};
