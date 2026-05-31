import { z } from "zod";
import { getPaginatedDataSchema } from "./utils";

/** @description Query schema for listing categories — optional name filter */
export const getModelCategoriesQuerySchema = z.object({
	query: z.string().optional(),
});

/** @description Params schema for getting a category by slug */
export const getModelCategoryParamsSchema = z.object({
	slug: z.string().min(1),
});

/** @description Query schema for listing makers — pagination, sorting, and optional name filter */
export const getModelMakersQuerySchema = getPaginatedDataSchema.extend({
	sort: z.enum(["newer", "older", "name", "most_devices"]).optional(),
});

/** @description Params schema for getting a maker by slug */
export const getModelMakerParamsSchema = z.object({
	slug: z.string().min(1),
});

/** @description Enum of valid device model release statuses */
export const modelStatuses = z.enum([
	"Available",
	"Discontinued",
	"Cancelled",
	"Rumored",
]);

/** @description Query schema for listing models — pagination, fulltext search, filters, and sorting */
export const getModelsQuerySchema = getPaginatedDataSchema.extend({
	makerId: z.string().cuid2().optional(),
	categoryId: z.string().cuid2().optional(),
	status: modelStatuses.optional(),
	sort: z.enum(["newer", "older", "name"]).optional(),
});

/** @description Params schema for getting a model by slug */
export const getModelBySlugParamsSchema = z.object({
	slug: z.string().min(1),
});
