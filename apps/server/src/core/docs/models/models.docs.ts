import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	createModelBodySchema,
	createModelImageBodySchema,
	getModelsQuerySchema,
	modelDetailSchema,
	modelImageSchema,
	modelListItemSchema,
	patchModelBodySchema,
} from "@fixr/schemas/models";
import { paginatedDataSchema } from "@fixr/schemas/utils";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import { zodResponseSchema } from "../types";

const modelDetailParamsSchema = z
	.object({
		subdomain: z.string(),
		slug: z.string(),
	})
	.describe("Company subdomain and model slug.");

const listModelsSchema: FastifySchema = {
	tags: ["Devices"],
	summary: "List device models",
	description: `
**Retrieves device models (paginated minimal list) for mounting a table.**

Returns base (global) models plus company-specific models.

Optional filters (query string):
- \`query\`: every word must appear in the name, brand, model numbers, chipset or CPU
- \`makerId\`: filter by brand (cuid2)
- \`categoryId\`: filter by category (cuid2)
- \`status\`: release status: Available, Discontinued, Cancelled, Rumored
- \`page\`, \`perPage\`, \`sort\` (\`newer\` | \`older\` | \`name\`): pagination (see API pagination docs). \`newer\` and \`older\` order by release date.
`,
	params: getCompanyNestedDataSchema,
	querystring: getModelsQuerySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Models successfully retrieved.",
			code: "list_models_success",
			data: paginatedDataSchema(modelListItemSchema),
		}).describe("Models retrieved successfully."),
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
	},
	security: [{ JWT: [] }],
};

const getModelBySlugSchema: FastifySchema = {
	tags: ["Devices"],
	summary: "Get device model by slug",
	description: `
**Retrieves full device model details by slug.**

Returns all spec fields, related maker and category, and model images with presigned URLs.
`,
	params: modelDetailParamsSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Model retrieved successfully.",
			code: "get_model_success",
			data: modelDetailSchema,
		}).describe("Model retrieved successfully."),
		404: zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "model_not_found",
			message: "Model not found.",
			data: null,
		}).describe("Model not found."),
		403: zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "not_allowed",
			message: "You are not authorized to access this company.",
			data: null,
		}).describe("Not allowed to access this company."),
	},
	security: [{ JWT: [] }],
};

const createModelSchema: FastifySchema = {
	tags: ["Devices"],
	summary: "Create device model",
	description: `
**Creates a new device model record.**

Only company-specific models can be created.
- \`name\` and \`makerId\` are required.
- \`slug\` is auto-generated from \`name\` if not provided.
- All spec fields are optional and can be filled later via PATCH.
`,
	params: getCompanyNestedDataSchema,
	body: createModelBodySchema,
	response: {
		201: zodResponseSchema({
			status: 201,
			error: null,
			message: "Model created successfully.",
			code: "create_model_success",
			data: z.object({ id: z.string(), name: z.string(), slug: z.string() }),
		}).describe("Model created successfully."),
		409: zodResponseSchema({
			status: 409,
			error: "Conflict",
			code: "model_slug_conflict",
			message: "A model with this slug already exists.",
			data: null,
		}).describe("Slug already exists."),
		403: zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "not_allowed",
			message: "You are not authorized to access this company.",
			data: null,
		}).describe("Not allowed to access this company."),
	},
	security: [{ JWT: [] }],
};

const patchModelSchema: FastifySchema = {
	tags: ["Devices"],
	summary: "Update device model (partial)",
	description: `
**Partially updates a device model record.**

All fields are optional: only provided fields will be updated.
Returns the full model detail with presigned image URLs.
`,
	params: z.object({ subdomain: z.string(), modelId: z.string() }),
	body: patchModelBodySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Model updated successfully.",
			code: "patch_model_success",
			data: modelDetailSchema,
		}).describe("Model updated successfully."),
		404: zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "model_not_found",
			message: "Model not found.",
			data: null,
		}).describe("Model not found."),
		403: zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "not_allowed",
			message: "You are not authorized to access this company.",
			data: null,
		}).describe("Not allowed to access this company."),
	},
	security: [{ JWT: [] }],
};

const deleteModelSchema: FastifySchema = {
	tags: ["Devices"],
	summary: "Delete device model",
	description: `
**Deletes a device model and its associated images.**

Removes all related \`model_images\` records and deletes the uploaded files from storage.
`,
	params: z.object({ subdomain: z.string(), modelId: z.string() }),
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Model deleted successfully.",
			code: "delete_model_success",
			data: null,
		}).describe("Model deleted successfully."),
		404: zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "model_not_found",
			message: "Model not found.",
			data: null,
		}).describe("Model not found."),
		403: zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "not_allowed",
			message: "You are not authorized to access this company.",
			data: null,
		}).describe("Not allowed to access this company."),
	},
	security: [{ JWT: [] }],
};

const createModelImageSchema: FastifySchema = {
	tags: ["Devices"],
	summary: "Assign an uploaded image to a model",
	description: `
**Creates a model image record, linking an uploaded file to a device model.**

Provide the \`uploadId\` returned from the presign upload endpoint. Returns the created model image with a presigned URL.
`,
	params: z.object({ subdomain: z.string(), modelId: z.string() }),
	body: createModelImageBodySchema,
	response: {
		201: zodResponseSchema({
			status: 201,
			error: null,
			message: "Model image created successfully.",
			code: "create_model_image_success",
			data: modelImageSchema,
		}).describe("Model image created."),
		404: zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "model_not_found",
			message: "Model not found.",
			data: null,
		}).describe("Model not found."),
		403: zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "not_allowed",
			message: "You are not authorized to access this company.",
			data: null,
		}).describe("Not allowed."),
	},
	security: [{ JWT: [] }],
};

const deleteModelImageSchema: FastifySchema = {
	tags: ["Devices"],
	summary: "Delete a model image",
	description: `
**Deletes a model image record and removes the uploaded file from storage.**
`,
	params: z.object({
		subdomain: z.string(),
		modelId: z.string(),
		imageId: z.string(),
	}),
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Model image deleted successfully.",
			code: "delete_model_image_success",
			data: null,
		}).describe("Model image deleted."),
		404: zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "model_image_not_found",
			message: "Model image not found.",
			data: null,
		}).describe("Image not found."),
		403: zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "not_allowed",
			message: "You are not authorized to access this company.",
			data: null,
		}).describe("Not allowed."),
	},
	security: [{ JWT: [] }],
};

/** @description OpenAPI schemas for the models module */
export const modelsDocs = {
	listModelsSchema,
	getModelBySlugSchema,
	createModelSchema,
	patchModelSchema,
	deleteModelSchema,
	createModelImageSchema,
	deleteModelImageSchema,
};
