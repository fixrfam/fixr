import { supplierSelectSchema } from "@fixr/db/schema";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	createSupplierSchema,
	getSuppliersQuerySchema,
	patchSupplierSchema,
	supplierIdParamsSchema,
} from "@fixr/schemas/suppliers";
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

const supplierRecordSchema = z.object(supplierSelectSchema.shape);

const supplierParams = getCompanyNestedDataSchema.extend(
	supplierIdParamsSchema.shape
);

const supplierNotFound = notFoundError(
	"supplier_not_found",
	"Supplier not found."
);

const cnpjConflict = conflictError(
	"supplier_cnpj_conflict",
	"A supplier with this CNPJ already exists in this company."
);

const listSuppliersSchema: FastifySchema = {
	tags: ["Parts & Services"],
	summary: "List suppliers",
	description: `
**Retrieves the company's suppliers (paginated)**

- \`query\`: search in name, CNPJ or contact
- \`page\`, \`perPage\`, \`sort\` (\`newer\` | \`older\` | \`name\`)
`,
	params: getCompanyNestedDataSchema,
	querystring: getSuppliersQuerySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Suppliers retrieved successfully.",
			code: "list_suppliers_success",
			data: paginatedDataSchema(supplierRecordSchema),
		}).describe("Suppliers retrieved successfully."),
		416: pageOutOfBoundsError,
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const getSupplierSchema: FastifySchema = {
	tags: ["Parts & Services"],
	summary: "Get supplier",
	params: supplierParams,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Supplier retrieved successfully.",
			code: "get_supplier_success",
			data: supplierRecordSchema,
		}).describe("Supplier retrieved successfully."),
		...companyScopedErrors,
		404: supplierNotFound,
	},
	security: [{ JWT: [] }],
};

const createSupplierSchemaDoc: FastifySchema = {
	tags: ["Parts & Services"],
	summary: "Create supplier",
	description: `
**Creates a supplier for the authenticated company**

The CNPJ is stored with digits only and must be unique within the company.
`,
	params: getCompanyNestedDataSchema,
	body: createSupplierSchema,
	response: {
		201: zodResponseSchema({
			status: 201,
			error: null,
			message: "Supplier created successfully.",
			code: "create_supplier_success",
			data: supplierRecordSchema,
		}).describe("Supplier created successfully."),
		409: cnpjConflict,
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const patchSupplierSchemaDoc: FastifySchema = {
	tags: ["Parts & Services"],
	summary: "Update supplier",
	params: supplierParams,
	body: patchSupplierSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Supplier updated successfully.",
			code: "patch_supplier_success",
			data: supplierRecordSchema,
		}).describe("Supplier updated successfully."),
		409: cnpjConflict,
		...companyScopedErrors,
		404: supplierNotFound,
	},
	security: [{ JWT: [] }],
};

const deleteSupplierSchema: FastifySchema = {
	tags: ["Parts & Services"],
	summary: "Delete supplier",
	description: `
**Deletes a supplier.** Refused with \`409 supplier_in_use\` while parts still reference it.
`,
	params: supplierParams,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Supplier deleted successfully.",
			code: "delete_supplier_success",
			data: null,
		}).describe("Supplier deleted successfully."),
		409: conflictError(
			"supplier_in_use",
			"This supplier still has parts linked to it."
		),
		...companyScopedErrors,
		404: supplierNotFound,
	},
	security: [{ JWT: [] }],
};

export const suppliersDocs = {
	listSuppliersSchema,
	getSupplierSchema,
	createSupplierSchema: createSupplierSchemaDoc,
	patchSupplierSchema: patchSupplierSchemaDoc,
	deleteSupplierSchema,
};
