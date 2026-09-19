import { modelMakerSelectSchema } from "@fixr/db/schema";
import {
	getModelMakerParamsSchema,
	getModelMakersQuerySchema,
} from "@fixr/schemas/models";
import { paginatedDataSchema } from "@fixr/schemas/utils";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import { zodResponseSchema } from "../types";

const makerListRecordSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	url: z.string(),
	deviceCount: z.number(),
	pageCount: z.number().nullable(),
	createdAt: z.coerce.date(),
});

const listMakersSchema: FastifySchema = {
	tags: ["Devices"],
	summary: "List model makers",
	description: `
**Retrieves device makers (brands) with pagination.**

Optional filters (query string):
- \`query\`: search by maker name
- \`page\`, \`perPage\`, \`sort\` (\`newer\` | \`older\` | \`name\` | \`most_devices\`): pagination (see API pagination docs)
`,
	querystring: getModelMakersQuerySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Makers successfully retrieved.",
			code: "list_makers_success",
			data: paginatedDataSchema(makerListRecordSchema),
		}).describe("Makers retrieved successfully."),
		416: zodResponseSchema({
			status: 416,
			error: "Range Not Satisfiable",
			code: "page_out_of_bounds",
			message: "The requested page exceeds the total number of pages.",
			data: null,
		}).describe("Requested page exceeds total pages."),
	},
	security: [{ JWT: [] }],
};

const getMakerBySlugSchema: FastifySchema = {
	tags: ["Devices"],
	summary: "Get maker by slug",
	description: "Retrieves a single device maker by its slug.",
	params: getModelMakerParamsSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Maker retrieved successfully.",
			code: "get_maker_success",
			data: modelMakerSelectSchema,
		}).describe("Maker retrieved successfully."),
		404: zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "maker_not_found",
			message: "Maker not found.",
			data: null,
		}).describe("Maker not found."),
	},
	security: [{ JWT: [] }],
};

/** @description OpenAPI schemas for the makers module */
export const makersDocs = {
	listMakersSchema,
	getMakerBySlugSchema,
};
