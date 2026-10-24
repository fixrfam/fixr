import { partSelectSchema } from "@fixr/db/schema";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	adjustPartStockSchema,
	createPartSchema,
	getPartsQuerySchema,
	partIdParamsSchema,
	patchPartSchema,
} from "@fixr/schemas/parts";
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

const partRecordSchema = z.object({
	...partSelectSchema.shape,
	supplier: z.object({ id: z.string(), name: z.string() }),
});

const partParams = getCompanyNestedDataSchema.extend(partIdParamsSchema.shape);

const partNotFound = notFoundError("part_not_found", "Part not found.");

const skuConflict = conflictError(
	"part_sku_conflict",
	"A part with this SKU already exists in this company."
);

const supplierNotFound = zodResponseSchema({
	status: 400,
	error: "Bad Request",
	code: "part_supplier_not_found",
	message: "The supplier does not exist in this company.",
	data: null,
}).describe("The supplier does not exist in this company.");

const listPartsSchema: FastifySchema = {
	tags: ["Parts"],
	summary: "List parts",
	description: `
**Retrieves the company's parts (paginated)**

Optional filters (query string):
- \`query\`: search in name or SKU
- \`category\`: exact category
- \`supplierId\`: supplier (cuid2)
- \`lowStock\`: \`true\` returns only parts at or below their minimum stock
- \`page\`, \`perPage\`, \`sort\` (\`newer\` | \`older\` | \`name\`)
`,
	params: getCompanyNestedDataSchema,
	querystring: getPartsQuerySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Parts retrieved successfully.",
			code: "list_parts_success",
			data: paginatedDataSchema(partRecordSchema),
		}).describe("Parts retrieved successfully."),
		416: pageOutOfBoundsError,
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const getPartSchema: FastifySchema = {
	tags: ["Parts"],
	summary: "Get part",
	params: partParams,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Part retrieved successfully.",
			code: "get_part_success",
			data: partRecordSchema,
		}).describe("Part retrieved successfully."),
		...companyScopedErrors,
		404: partNotFound,
	},
	security: [{ JWT: [] }],
};

const createPartSchemaDoc: FastifySchema = {
	tags: ["Parts"],
	summary: "Create part",
	description: `
**Creates a part for the authenticated company**

Rules:
- The SKU is unique within the company.
- The supplier must belong to the company.
- The sale price can't be lower than the cost price.
`,
	params: getCompanyNestedDataSchema,
	body: createPartSchema,
	response: {
		201: zodResponseSchema({
			status: 201,
			error: null,
			message: "Part created successfully.",
			code: "create_part_success",
			data: partRecordSchema,
		}).describe("Part created successfully."),
		400: supplierNotFound,
		409: skuConflict,
		...companyScopedErrors,
	},
	security: [{ JWT: [] }],
};

const patchPartSchemaDoc: FastifySchema = {
	tags: ["Parts"],
	summary: "Update part",
	description: `
**Partially updates a part.** When only one of the prices is sent it is checked against the stored one (\`400 part_sale_price_below_cost\`).

The stock is not editable here: use \`POST /parts/:partId/stock-adjustments\`.
`,
	params: partParams,
	body: patchPartSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Part updated successfully.",
			code: "patch_part_success",
			data: partRecordSchema,
		}).describe("Part updated successfully."),
		400: supplierNotFound,
		409: skuConflict,
		...companyScopedErrors,
		404: partNotFound,
	},
	security: [{ JWT: [] }],
};

const adjustPartStockSchemaDoc: FastifySchema = {
	tags: ["Parts"],
	summary: "Adjust part stock",
	description: `
**Adds or removes units from a part's stock.** \`delta\` is a non-zero whole number, negative to remove. The change is applied atomically, and an adjustment that would leave the stock below zero is refused (\`409 part_stock_insufficient\`).

Requires \`inventory:adjust\`.
`,
	params: partParams,
	body: adjustPartStockSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Part stock adjusted successfully.",
			code: "adjust_part_stock_success",
			data: partRecordSchema,
		}).describe("Part stock adjusted successfully."),
		409: conflictError(
			"part_stock_insufficient",
			"The adjustment would leave the stock below zero."
		),
		...companyScopedErrors,
		404: partNotFound,
	},
	security: [{ JWT: [] }],
};

const deletePartSchema: FastifySchema = {
	tags: ["Parts"],
	summary: "Delete part",
	description: `
**Deletes a part.** It is also removed from the services that suggested it.
`,
	params: partParams,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Part deleted successfully.",
			code: "delete_part_success",
			data: null,
		}).describe("Part deleted successfully."),
		...companyScopedErrors,
		404: partNotFound,
	},
	security: [{ JWT: [] }],
};

export const partsDocs = {
	listPartsSchema,
	getPartSchema,
	createPartSchema: createPartSchemaDoc,
	patchPartSchema: patchPartSchemaDoc,
	adjustPartStockSchema: adjustPartStockSchemaDoc,
	deletePartSchema,
};
