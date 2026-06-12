import { modelCategorySelectSchema } from "@fixr/db/schema";
import {
	getModelCategoriesQuerySchema,
	getModelCategoryParamsSchema,
} from "@fixr/schemas/models";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import { zodResponseSchema } from "../types";

const listCategoriesSchema: FastifySchema = {
	tags: ["Devices"],
	summary: "List model categories",
	description: `
**Retrieves all device categories.**
Categories are global and not tied to a specific company.

Optional filter (query string):
- \`query\`: search by category name
`,
	querystring: getModelCategoriesQuerySchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Categories retrieved successfully.",
			code: "list_categories_success",
			data: z.array(modelCategorySelectSchema),
		}).describe("Categories retrieved successfully."),
	},
	security: [{ JWT: [] }],
};

const getCategoryBySlugSchema: FastifySchema = {
	tags: ["Devices"],
	summary: "Get category by slug",
	description: "Retrieves a single device category by its slug.",
	params: getModelCategoryParamsSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Category retrieved successfully.",
			code: "get_category_success",
			data: modelCategorySelectSchema,
		}).describe("Category retrieved successfully."),
		404: zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "category_not_found",
			message: "Category not found.",
			data: null,
		}).describe("Category not found."),
	},
	security: [{ JWT: [] }],
};

/** @description OpenAPI schemas for the categories module */
export const categoriesDocs = {
	listCategoriesSchema,
	getCategoryBySlugSchema,
};
