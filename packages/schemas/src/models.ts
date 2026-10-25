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

/**
 * @description Query schema for listing models: pagination, search, filters
 * and sorting. `newer`/`older` order by release date (models without one go
 * last), then by when they were added.
 */
export const getModelsQuerySchema = getPaginatedDataSchema.extend({
	makerId: z.string().cuid2().optional(),
	categoryId: z.string().cuid2().optional(),
	status: modelStatuses.optional(),
	sort: z.enum(["newer", "older", "name"]).optional(),
});

/** @description Maker or category summary embedded in model records */
const modelRelationSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
});

/** @description One row of the models list: identity plus the specs shown in it */
export const modelListItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	imageUrl: z.string().nullable(),
	status: z.string().nullable(),
	price: z.string().nullable(),
	announced: z.string().nullable(),
	released: z.string().nullable(),
	displaySize: z.string().nullable(),
	displaySizeInches: z.number().nullable(),
	displayResolution: z.string().nullable(),
	chipset: z.string().nullable(),
	cpu: z.string().nullable(),
	internalMemory: z.string().nullable(),
	battery: z.string().nullable(),
	colorsHex: z.string().nullable(),
	/** True for a model the company added; false for the shared catalog. */
	isCustom: z.boolean(),
	maker: modelRelationSchema,
	category: modelRelationSchema.nullable(),
});

/**
 * @description Extra specs stored as JSON in `models.meta`. The shared catalog
 * fills these keys; other keys are kept but have no label in the app.
 */
export const modelMetaSchema = z
	.object({
		network2g: z.string(),
		network3g: z.string(),
		network4g: z.string(),
		network5g: z.string(),
		networkSpeed: z.string(),
		wlan: z.string(),
		bluetooth: z.string(),
		gps: z.string(),
		nfc: z.string(),
		radio: z.string(),
		usb: z.string(),
		ram: z.string(),
		refreshRate: z.string(),
		panelType: z.string(),
		backlight: z.string(),
		brightness: z.string(),
		staticContrast: z.string(),
		dynamicContrast: z.string(),
		colorGamut: z.string(),
		viewingAngles: z.string(),
	})
	.partial();

/** @description An image of a model, with a temporary URL to show it */
export const modelImageSchema = z.object({
	id: z.string(),
	modelId: z.string(),
	uploadId: z.string(),
	presignedUrl: z.string().nullable(),
	isPrimary: z.boolean(),
	variant: z.string().nullable(),
	position: z.number(),
	createdAt: z.coerce.date(),
});

/** @description Every field of a model, with its maker, category and images */
export const modelDetailSchema = z.object({
	id: z.string(),
	makerId: z.string(),
	name: z.string(),
	slug: z.string(),
	url: z.string(),
	imageUrl: z.string().nullable(),
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
	maker: modelRelationSchema.extend({ url: z.string() }),
	category: modelRelationSchema.nullable(),
	images: z.array(modelImageSchema),
});

export type ModelListItem = z.infer<typeof modelListItemSchema>;
export type ModelDetail = z.infer<typeof modelDetailSchema>;
export type ModelMeta = z.infer<typeof modelMetaSchema>;

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
	uploadId: z.string().min(1),
	isPrimary: z.boolean().optional(),
	variant: z.string().optional(),
	position: z.number().int().optional(),
});
