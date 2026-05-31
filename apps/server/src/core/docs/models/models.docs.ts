import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import { getModelsQuerySchema } from "@fixr/schemas/models";
import { paginatedDataSchema } from "@fixr/schemas/utils";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import { zodResponseSchema } from "../types";

const modelListRecordSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	imageUrl: z.string().nullable(),
	imageLocalPath: z.string().nullable(),
	presignedImageUrl: z.string().nullable(),
	status: z.string().nullable(),
	price: z.string().nullable(),
	released: z.string().nullable(),
	maker: z.object({
		id: z.string(),
		name: z.string(),
		slug: z.string(),
	}),
	category: z
		.object({
			id: z.string(),
			name: z.string(),
			slug: z.string(),
		})
		.nullable(),
});

const modelImageRecordSchema = z.object({
	id: z.string(),
	modelId: z.string(),
	originalUrl: z.string().nullable(),
	r2Key: z.string().nullable(),
	presignedUrl: z.string().nullable(),
	isPrimary: z.boolean(),
	variant: z.string().nullable(),
	position: z.number(),
	createdAt: z.coerce.date(),
});

const modelDetailRecordSchema = z.object({
	id: z.string(),
	makerId: z.string(),
	name: z.string(),
	slug: z.string(),
	url: z.string(),
	imageUrl: z.string().nullable(),
	imageLocalPath: z.string().nullable(),
	presignedImageUrl: z.string().nullable(),
	categoryId: z.string().nullable(),
	announced: z.string().nullable(),
	status: z.string().nullable(),
	dimensions: z.string().nullable(),
	weight: z.string().nullable(),
	build: z.string().nullable(),
	sim: z.string().nullable(),
	displayType: z.string().nullable(),
	displaySize: z.string().nullable(),
	displayResolution: z.string().nullable(),
	displayProtection: z.string().nullable(),
	os: z.string().nullable(),
	chipset: z.string().nullable(),
	cpu: z.string().nullable(),
	gpu: z.string().nullable(),
	cardSlot: z.string().nullable(),
	internalMemory: z.string().nullable(),
	mainCamera: z.string().nullable(),
	mainCameraFeatures: z.string().nullable(),
	mainCameraVideo: z.string().nullable(),
	selfieCamera: z.string().nullable(),
	selfieFeatures: z.string().nullable(),
	selfieVideo: z.string().nullable(),
	battery: z.string().nullable(),
	batteryCharging: z.string().nullable(),
	networkTech: z.string().nullable(),
	sensors: z.string().nullable(),
	colors: z.string().nullable(),
	colorsHex: z.string().nullable(),
	modelsText: z.string().nullable(),
	price: z.string().nullable(),
	dimensionsWidth: z.number().nullable(),
	dimensionsHeight: z.number().nullable(),
	dimensionsThickness: z.number().nullable(),
	weightGrams: z.number().nullable(),
	displaySizeInches: z.number().nullable(),
	displaySizeRatio: z.string().nullable(),
	displayResWidth: z.number().nullable(),
	displayResHeight: z.number().nullable(),
	displayResPpi: z.number().nullable(),
	released: z.string().nullable(),
	meta: z.string().nullable(),
	companyId: z.string().nullable(),
	createdAt: z.coerce.date(),
	maker: z.object({
		id: z.string(),
		name: z.string(),
		slug: z.string(),
		url: z.string(),
	}),
	category: z
		.object({
			id: z.string(),
			name: z.string(),
			slug: z.string(),
		})
		.nullable(),
	images: z.array(modelImageRecordSchema),
});

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
- \`query\`: fulltext search on name, model variants, chipset, CPU, internal memory, OS
- \`makerId\`: filter by brand (cuid2)
- \`categoryId\`: filter by category (cuid2)
- \`status\`: release status: Available, Discontinued, Cancelled, Rumored
- \`page\`, \`perPage\`, \`sort\` (\`newer\` | \`older\` | \`name\`): pagination (see API pagination docs)
`,
	params: getCompanyNestedDataSchema,
	querystring: getModelsQuerySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Models successfully retrieved.",
			code: "list_models_success",
			data: paginatedDataSchema(modelListRecordSchema),
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
			data: modelDetailRecordSchema,
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

/** @description OpenAPI schemas for the models module */
export const modelsDocs = {
	listModelsSchema,
	getModelBySlugSchema,
};
