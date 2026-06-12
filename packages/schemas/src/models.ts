import { z } from "zod";
import { getPaginatedDataSchema } from "./utils";

/** @description Query schema for listing categories: optional name filter */
export const getModelCategoriesQuerySchema = z.object({
	query: z.string().optional(),
});

/** @description Params schema for getting a category by slug */
export const getModelCategoryParamsSchema = z.object({
	slug: z.string().min(1),
});

/** @description Query schema for listing makers: pagination, sorting, and optional name filter */
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

/** @description Query schema for listing models: pagination, fulltext search, filters, and sorting */
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

/** @description Body schema for creating a model */
export const createModelBodySchema = z.object({
	name: z.string().min(1).max(255),
	makerId: z.string().min(1),
	categoryId: z.string().optional(),
	status: modelStatuses.optional(),
	announced: z.string().optional(),
	dimensions: z.string().optional(),
	weight: z.string().optional(),
	build: z.string().optional(),
	sim: z.string().optional(),
	displayType: z.string().optional(),
	displaySize: z.string().optional(),
	displayResolution: z.string().optional(),
	displayProtection: z.string().optional(),
	os: z.string().optional(),
	chipset: z.string().optional(),
	cpu: z.string().optional(),
	gpu: z.string().optional(),
	cardSlot: z.string().optional(),
	internalMemory: z.string().optional(),
	mainCamera: z.string().optional(),
	mainCameraFeatures: z.string().optional(),
	mainCameraVideo: z.string().optional(),
	selfieCamera: z.string().optional(),
	selfieFeatures: z.string().optional(),
	selfieVideo: z.string().optional(),
	battery: z.string().optional(),
	batteryCharging: z.string().optional(),
	networkTech: z.string().optional(),
	sensors: z.string().optional(),
	colors: z.string().optional(),
	colorsHex: z.string().optional(),
	modelsText: z.string().optional(),
	price: z.string().optional(),
	dimensionsWidth: z.number().optional(),
	dimensionsHeight: z.number().optional(),
	dimensionsThickness: z.number().optional(),
	weightGrams: z.number().optional(),
	displaySizeInches: z.number().optional(),
	displaySizeRatio: z.string().optional(),
	displayResWidth: z.number().optional(),
	displayResHeight: z.number().optional(),
	displayResPpi: z.number().optional(),
	released: z.string().optional(),
	meta: z.string().optional(),
});

/** @description Body schema for partially updating a model (all fields optional) */
export const patchModelBodySchema = createModelBodySchema.partial();

/** @description Params schema for operating on a model by its ID */
export const modelIdParamsSchema = z.object({
	modelId: z.string().min(1),
});

/** @description Params schema for model image operations */
export const modelImageParamsSchema = z.object({
	modelId: z.string().min(1),
	imageId: z.string().min(1),
});

/** @description Body schema for assigning an uploaded image to a model */
export const createModelImageBodySchema = z.object({
	r2Key: z.string().min(1),
	isPrimary: z.boolean().optional(),
	variant: z.string().optional(),
	position: z.number().int().optional(),
});
