import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import {
	and,
	asc,
	db,
	desc,
	eq,
	inArray,
	or,
	type SQL,
	sql,
} from "@fixr/db/connection";
import {
	type ModelImageSelect,
	modelCategories,
	modelImages,
	modelMakers,
	models,
} from "@fixr/db/schema";
import {
	generatePresignedGetUrl,
	r2Bucket,
	r2Client,
} from "../../../config/r2";

const FTS_OPERATOR_REGEX = /[+\-*~()<>@]/;
const WHITESPACE_REGEX = /\s+/;

/** @description Column selection for paginated models minimal list */
export const modelMinimalListSelect = {
	id: models.id,
	name: models.name,
	slug: models.slug,
	status: models.status,
	price: models.price,
	released: models.released,
	makerId: modelMakers.id,
	makerName: modelMakers.name,
	makerSlug: modelMakers.slug,
	categoryId: modelCategories.id,
	categoryName: modelCategories.name,
	categorySlug: modelCategories.slug,
};

/** @description Join definitions for models list queries */
export const modelListJoins = [
	{
		type: "inner" as const,
		table: modelMakers,
		on: eq(modelMakers.id, models.makerId),
	},
	{
		type: "left" as const,
		table: modelCategories,
		on: eq(modelCategories.id, models.categoryId),
	},
];

export interface ModelFlatRecord {
	id: string;
	name: string;
	slug: string;
	status: string | null;
	price: string | null;
	released: string | null;
	makerId: string;
	makerName: string;
	makerSlug: string;
	categoryId: string | null;
	categoryName: string | null;
	categorySlug: string | null;
}

export interface ModelListRecord {
	id: string;
	name: string;
	slug: string;
	status: string;
	price: string | null;
	released: string | null;
	maker: { id: string; name: string; slug: string };
	category: { id: string; name: string; slug: string } | null;
	imageUrl: string | null;
}

/** @description Data access layer for device models */
export class ModelsRepository {
	/**
	 * Build a WHERE clause for filtering models with fulltext search support
	 *
	 * @param companyId - Company ID for scoping
	 * @param filters - Query, maker, category, and status filters
	 */
	static buildListFilter(
		companyId: string,
		filters: {
			query?: string;
			makerId?: string;
			categoryId?: string;
			status?: string;
		}
	) {
		const conditions: SQL[] = [
			or(eq(models.companyId, companyId), sql`${models.companyId} IS NULL`)!,
		];

		if (filters.makerId) {
			conditions.push(eq(models.makerId, filters.makerId));
		}
		if (filters.categoryId) {
			conditions.push(eq(models.categoryId, filters.categoryId));
		}
		if (filters.status) {
			conditions.push(eq(models.status, filters.status));
		}
		if (filters.query) {
			const hasOperators = FTS_OPERATOR_REGEX.test(filters.query);
			const ftsQuery = hasOperators
				? filters.query
				: filters.query
						.trim()
						.split(WHITESPACE_REGEX)
						.map((w) => `${w}*`)
						.join(" ");
			conditions.push(
				sql`MATCH(${models.name}, ${models.modelsText}, ${models.chipset}, ${models.cpu}, ${models.internalMemory}, ${models.os}) AGAINST(${ftsQuery} IN BOOLEAN MODE)`
			);
		}

		return and(...conditions)!;
	}

	/**
	 * Build an ORDER BY clause for models
	 *
	 * @param sort - Sort key: newer, older, name
	 */
	static buildOrder(sort?: string) {
		switch (sort) {
			case "newer":
				return desc(models.createdAt);
			case "older":
				return asc(models.createdAt);
			case "name":
				return asc(models.name);
			default:
				return desc(models.createdAt);
		}
	}

	/**
	 * Find a model by its slug with full maker and category relations
	 *
	 * @param slug - The model slug
	 * @param companyId - Optional company ID for scoping
	 * @returns The model record with relations or null
	 */
	static async queryModelBySlug(slug: string, companyId?: string) {
		const conditions: SQL[] = [eq(models.slug, slug)];
		if (companyId) {
			conditions.push(
				or(eq(models.companyId, companyId), sql`${models.companyId} IS NULL`)!
			);
		}

		const result = await db
			.select({
				id: models.id,
				makerId: models.makerId,
				name: models.name,
				slug: models.slug,
				url: models.url,
				categoryId: models.categoryId,
				announced: models.announced,
				status: models.status,
				dimensions: models.dimensions,
				weight: models.weight,
				build: models.build,
				sim: models.sim,
				displayType: models.displayType,
				displaySize: models.displaySize,
				displayResolution: models.displayResolution,
				displayProtection: models.displayProtection,
				os: models.os,
				chipset: models.chipset,
				cpu: models.cpu,
				gpu: models.gpu,
				cardSlot: models.cardSlot,
				internalMemory: models.internalMemory,
				mainCamera: models.mainCamera,
				mainCameraFeatures: models.mainCameraFeatures,
				mainCameraVideo: models.mainCameraVideo,
				selfieCamera: models.selfieCamera,
				selfieFeatures: models.selfieFeatures,
				selfieVideo: models.selfieVideo,
				battery: models.battery,
				batteryCharging: models.batteryCharging,
				networkTech: models.networkTech,
				sensors: models.sensors,
				colors: models.colors,
				colorsHex: models.colorsHex,
				modelsText: models.modelsText,
				price: models.price,
				dimensionsWidth: models.dimensionsWidth,
				dimensionsHeight: models.dimensionsHeight,
				dimensionsThickness: models.dimensionsThickness,
				weightGrams: models.weightGrams,
				displaySizeInches: models.displaySizeInches,
				displaySizeRatio: models.displaySizeRatio,
				displayResWidth: models.displayResWidth,
				displayResHeight: models.displayResHeight,
				displayResPpi: models.displayResPpi,
				released: models.released,
				meta: models.meta,
				companyId: models.companyId,
				createdAt: models.createdAt,
				maker: {
					id: modelMakers.id,
					name: modelMakers.name,
					slug: modelMakers.slug,
					url: modelMakers.url,
				},
				category: {
					id: modelCategories.id,
					name: modelCategories.name,
					slug: modelCategories.slug,
				},
			})
			.from(models)
			.innerJoin(modelMakers, eq(modelMakers.id, models.makerId))
			.leftJoin(modelCategories, eq(modelCategories.id, models.categoryId))
			.where(and(...conditions))
			.limit(1);

		return result[0] ?? null;
	}

	/**
	 * Query all images for a model, ordered by position
	 *
	 * @param modelId - The model ID
	 * @returns Array of model images
	 */
	static async queryModelImages(modelId: string) {
		return await db
			.select()
			.from(modelImages)
			.where(eq(modelImages.modelId, modelId))
			.orderBy(asc(modelImages.position));
	}

	/**
	 * Batch fetch primary model images for a set of model IDs
	 *
	 * @param modelIds - Array of model IDs
	 * @returns Map of modelId -> r2Key
	 */
	static async queryPrimaryImages(
		modelIds: string[]
	): Promise<Map<string, string>> {
		if (modelIds.length === 0) return new Map();
		const rows = await db
			.select({
				modelId: modelImages.modelId,
				r2Key: modelImages.r2Key,
			})
			.from(modelImages)
			.where(
				and(
					inArray(modelImages.modelId, modelIds),
					eq(modelImages.isPrimary, true)
				)
			);
		return new Map(
			rows.filter((r) => !!r.r2Key).map((r) => [r.modelId, r.r2Key!])
		);
	}

	/**
	 * Generate a presigned GET URL for an R2 key
	 *
	 * @param r2Key - The R2 object key
	 * @returns Presigned URL or null
	 */
	static async generateImagePresignedUrl(r2Key: string | null) {
		if (!r2Key) return null;
		return await generatePresignedGetUrl(r2Key);
	}

	/**
	 * Attach presigned GET URLs to an array of model images
	 *
	 * @param images - Array of model image records
	 * @returns Images with presignedUrl attached
	 */
	static async attachPresignedUrlsToImages(
		images: ModelImageSelect[]
	): Promise<(ModelImageSelect & { presignedUrl: string })[]> {
		return await Promise.all(
			images.map(async (img) => {
				const r2Key = img.r2Key as string;
				const presignedUrl = await generatePresignedGetUrl(r2Key);
				return { ...img, presignedUrl };
			})
		);
	}

	/**
	 * Check if a slug already exists for a given company
	 *
	 * @param slug - The slug to check
	 * @param companyId - Company ID for scoping
	 * @returns The matching model or undefined
	 */
	static async queryBySlugAndCompany(slug: string, companyId: string) {
		const [model] = await db
			.select({ id: models.id })
			.from(models)
			.where(
				and(
					eq(models.slug, slug),
					or(eq(models.companyId, companyId), sql`${models.companyId} IS NULL`)
				)
			)
			.limit(1);
		return model;
	}

	/**
	 * Check if a maker exists by ID
	 *
	 * @param makerId - The maker ID
	 * @returns The maker or undefined
	 */
	static async queryMakerById(makerId: string) {
		const [maker] = await db
			.select({ id: modelMakers.id })
			.from(modelMakers)
			.where(eq(modelMakers.id, makerId))
			.limit(1);
		return maker;
	}

	/**
	 * Insert a new model record
	 *
	 * @param data - The model data to insert
	 */
	static async insertModel(data: typeof models.$inferInsert) {
		await db.insert(models).values(data);
	}

	/**
	 * Insert a model image record
	 *
	 * @param data - The model image data
	 * @returns The created model image
	 */
	static async insertModelImage(data: typeof modelImages.$inferInsert) {
		const id = data.id as string;
		await db.insert(modelImages).values(data);
		const [created] = await db
			.select()
			.from(modelImages)
			.where(eq(modelImages.id, id))
			.limit(1);
		return created;
	}

	/**
	 * Delete a single model image record
	 *
	 * @param imageId - The image ID
	 */
	static async deleteModelImageRecord(imageId: string) {
		await db.delete(modelImages).where(eq(modelImages.id, imageId));
	}

	/**
	 * Get all R2 keys associated with a model (model images + the model's own imageLocalPath)
	 *
	 * @param modelId - The model ID
	 * @returns Array of R2 keys
	 */
	static async queryR2KeysByModel(modelId: string) {
		const imageKeys = await db
			.select({ key: modelImages.r2Key })
			.from(modelImages)
			.where(eq(modelImages.modelId, modelId));

		return imageKeys.map((img) => img.key).filter((k): k is string => !!k);
	}

	/**
	 * Delete an R2 object by key
	 *
	 * @param key - The R2 object key
	 */
	static async deleteR2Object(key: string) {
		await r2Client.send(
			new DeleteObjectCommand({
				Bucket: r2Bucket,
				Key: key,
			})
		);
	}

	/**
	 * Update a model record (partial)
	 *
	 * @param id - The model ID
	 * @param data - The fields to update
	 */
	static async updateModel(
		id: string,
		data: Partial<typeof models.$inferInsert>
	) {
		await db.update(models).set(data).where(eq(models.id, id));
	}

	/**
	 * Delete a model record and its associated images
	 *
	 * @param id - The model ID
	 */
	static async deleteModel(id: string) {
		const keys = await ModelsRepository.queryR2KeysByModel(id);
		await Promise.all(keys.map((k) => ModelsRepository.deleteR2Object(k)));
		await db.delete(modelImages).where(eq(modelImages.modelId, id));
		await db.delete(models).where(eq(models.id, id));
	}
}
