import { slugify } from "@fixr/constants/slug";
import { models } from "@fixr/db/schema";
import type {
	createModelBodySchema,
	createModelImageBodySchema,
} from "@fixr/schemas/models";
import { createId } from "@paralleldrive/cuid2";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { AppError } from "../../../core/lib/app-error";
import {
	getPaginatedCount,
	getPaginatedRecords,
} from "../../../core/lib/pagination";
import { apiResponse, paginatedData } from "../../../core/lib/response";
import {
	type ModelFlatRecord,
	type ModelListRecord,
	ModelsRepository,
	modelListJoins,
	modelMinimalListSelect,
} from "../repositories";

/** @description Business logic for device models */
export class ModelsService {
	private static buildCreateModelValues(
		data: z.infer<typeof createModelBodySchema>,
		modelId: string,
		companyId: string,
		slug: string
	): typeof models.$inferInsert {
		return {
			id: modelId,
			slug,
			url: `/models/${slug}`,
			companyId,
			...Object.fromEntries(
				Object.entries(data).filter(([_, v]) => v !== undefined)
			),
		} as typeof models.$inferInsert;
	}
	/**
	 * List models with pagination, fulltext search, and filters
	 *
	 * @param userJwt - Authenticated user JWT payload
	 * @param subdomain - Company subdomain
	 * @param page - Current page number
	 * @param perPage - Items per page
	 * @param query - Fulltext search query
	 * @param makerId - Filter by maker
	 * @param categoryId - Filter by category
	 * @param status - Filter by release status
	 * @param sort - Sort direction
	 * @param response - Fastify reply
	 */
	static async listModels({
		userJwt,
		subdomain,
		page,
		perPage,
		query,
		makerId,
		categoryId,
		status,
		sort,
		response,
	}: {
		userJwt: { id: string; company?: { id: string; subdomain: string } };
		subdomain: string;
		page: number;
		perPage?: number;
		query?: string;
		makerId?: string;
		categoryId?: string;
		status?: string;
		sort?: string;
		response: FastifyReply;
	}) {
		if (!userJwt.company) {
			throw new AppError("MODEL_COMPANY_NOT_FOUND");
		}

		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("MODEL_NOT_ALLOWED");
		}

		const companyId = userJwt.company.id;
		const PER_PAGE = perPage ?? 10;

		const filter = ModelsRepository.buildListFilter(companyId, {
			query,
			makerId,
			categoryId,
			status,
		});
		const order = ModelsRepository.buildOrder(sort);

		const [records, totalRecords] = await Promise.all([
			getPaginatedRecords({
				table: models,
				select: modelMinimalListSelect,
				skip: (page - 1) * PER_PAGE,
				take: PER_PAGE,
				where: filter,
				order,
				joins: modelListJoins,
			}),
			getPaginatedCount({
				table: models,
				where: filter,
			}),
		]);

		if (totalRecords === 0) {
			return response.status(200).send(
				apiResponse({
					status: 200,
					error: null,
					message: "Models successfully retrieved.",
					code: "list_models_success",
					data: paginatedData({
						records: [],
						pagination: {
							total_records: 0,
							total_pages: 0,
							current_page: 1,
							next_page: null,
							prev_page: null,
						},
					}),
				})
			);
		}

		const total_pages = Math.ceil(totalRecords / PER_PAGE);

		if (page > total_pages) {
			throw new AppError("MODEL_PAGE_OUT_OF_BOUNDS");
		}

		const next_page =
			PER_PAGE * (page - 1) + records.length < totalRecords ? page + 1 : null;

		const modelIds = (records as ModelFlatRecord[]).map((r) => r.id);
		const primaryImageMap = await ModelsRepository.queryPrimaryImages(modelIds);

		const recordsWithImages: ModelListRecord[] = await Promise.all(
			(records as ModelFlatRecord[]).map(async (r) => ({
				id: r.id,
				name: r.name,
				slug: r.slug,
				status: r.status ?? "Available",
				price: r.price,
				released: r.released,
				maker: {
					id: r.makerId,
					name: r.makerName,
					slug: r.makerSlug,
				},
				category: r.categoryId
					? {
							id: r.categoryId,
							name: r.categoryName!,
							slug: r.categorySlug!,
						}
					: null,
				imageUrl: await ModelsRepository.generateImagePresignedUrl(
					primaryImageMap.get(r.id) ?? null
				),
			}))
		);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				message: "Models successfully retrieved.",
				code: "list_models_success",
				data: paginatedData({
					records: recordsWithImages,
					pagination: {
						total_records: totalRecords,
						total_pages,
						current_page: page,
						next_page,
						prev_page: page > 1 ? page - 1 : null,
					},
				}),
			})
		);
	}

	/**
	 * Get a single model by slug with full details and presigned image URLs
	 *
	 * @param userJwt - Authenticated user JWT payload
	 * @param subdomain - Company subdomain
	 * @param slug - The model slug
	 * @param response - Fastify reply
	 */
	static async getModelBySlug({
		userJwt,
		subdomain,
		slug,
		response,
	}: {
		userJwt: { id: string; company?: { id: string; subdomain: string } };
		subdomain: string;
		slug: string;
		response: FastifyReply;
	}) {
		if (!userJwt.company) {
			throw new AppError("MODEL_COMPANY_NOT_FOUND");
		}

		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("MODEL_NOT_ALLOWED");
		}

		const model = await ModelsRepository.queryModelBySlug(
			slug,
			userJwt.company.id
		);

		if (!model) {
			throw new AppError("MODEL_NOT_FOUND");
		}

		const images = await ModelsRepository.queryModelImages(model.id as string);

		const primaryImage = images.find((img) => img.isPrimary);
		const [imageUrl, imagesWithPresignedUrls] = await Promise.all([
			ModelsRepository.generateImagePresignedUrl(primaryImage?.r2Key ?? null),
			ModelsRepository.attachPresignedUrlsToImages(images),
		]);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "get_model_success",
				message: "Model retrieved successfully.",
				data: {
					...model,
					status: model.status ?? "Available",
					imageUrl,
					images: imagesWithPresignedUrls,
				},
			})
		);
	}

	/**
	 * Create a new model
	 *
	 * @param userJwt - Authenticated user JWT payload
	 * @param subdomain - Company subdomain
	 * @param data - The model data
	 * @param response - Fastify reply
	 */
	static async createModel({
		userJwt,
		subdomain,
		data,
		response,
	}: {
		userJwt: { id: string; company?: { id: string; subdomain: string } };
		subdomain: string;
		data: z.infer<typeof createModelBodySchema>;
		response: FastifyReply;
	}) {
		if (!userJwt.company) {
			throw new AppError("MODEL_COMPANY_NOT_FOUND");
		}

		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("MODEL_NOT_ALLOWED");
		}

		const maker = await ModelsRepository.queryMakerById(data.makerId);

		if (!maker) {
			throw new AppError("MODEL_MAKER_NOT_FOUND");
		}

		const slug = slugify(data.name);

		const existing = await ModelsRepository.queryBySlugAndCompany(
			slug,
			userJwt.company.id
		);

		if (existing) {
			throw new AppError("MODEL_SLUG_CONFLICT");
		}

		const modelId = createId();
		const companyId = userJwt.company.id;

		const values = ModelsService.buildCreateModelValues(
			data,
			modelId,
			companyId,
			slug
		);
		await ModelsRepository.insertModel(values);

		return response.status(201).send(
			apiResponse({
				status: 201,
				error: null,
				code: "create_model_success",
				message: "Model created successfully.",
				data: { id: modelId, name: data.name, slug },
			})
		);
	}

	/**
	 * Partially update a model
	 *
	 * @param userJwt - Authenticated user JWT payload
	 * @param subdomain - Company subdomain
	 * @param modelId - The model ID
	 * @param data - The fields to update
	 * @param response - Fastify reply
	 */
	static async patchModel({
		userJwt,
		subdomain,
		modelId,
		data,
		response,
	}: {
		userJwt: { id: string; company?: { id: string; subdomain: string } };
		subdomain: string;
		modelId: string;
		data: Record<string, unknown>;
		response: FastifyReply;
	}) {
		if (!userJwt.company) {
			throw new AppError("MODEL_COMPANY_NOT_FOUND");
		}
		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("MODEL_NOT_ALLOWED");
		}

		const model = await ModelsRepository.queryModelBySlug(
			modelId,
			userJwt.company.id
		);

		if (!model) {
			throw new AppError("MODEL_NOT_FOUND");
		}

		const updateData: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(data)) {
			updateData[key] = value ?? null;
		}

		if (Object.keys(updateData).length > 0) {
			await ModelsRepository.updateModel(modelId, updateData);
		}

		const updated = await ModelsRepository.queryModelBySlug(
			model.id as string,
			userJwt.company.id
		);

		const images = await ModelsRepository.queryModelImages(model.id as string);

		const primaryImage = images.find((img) => img.isPrimary);
		const [imageUrl, imagesWithPresignedUrls] = await Promise.all([
			ModelsRepository.generateImagePresignedUrl(primaryImage?.r2Key ?? null),
			ModelsRepository.attachPresignedUrlsToImages(images),
		]);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "patch_model_success",
				message: "Model updated successfully.",
				data: {
					...(updated ?? model),
					status: (updated ?? model).status ?? "Available",
					imageUrl,
					images: imagesWithPresignedUrls,
				},
			})
		);
	}

	/**
	 * Delete a model
	 *
	 * @param userJwt - Authenticated user JWT payload
	 * @param subdomain - Company subdomain
	 * @param modelId - The model ID
	 * @param response - Fastify reply
	 */
	static async deleteModel({
		userJwt,
		subdomain,
		modelId,
		response,
	}: {
		userJwt: { id: string; company?: { id: string; subdomain: string } };
		subdomain: string;
		modelId: string;
		response: FastifyReply;
	}) {
		if (!userJwt.company) {
			throw new AppError("MODEL_COMPANY_NOT_FOUND");
		}
		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("MODEL_NOT_ALLOWED");
		}

		const model = await ModelsRepository.queryModelBySlug(
			modelId,
			userJwt.company.id
		);
		if (!model) {
			throw new AppError("MODEL_NOT_FOUND");
		}

		await ModelsRepository.deleteModel(model.id as string);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "delete_model_success",
				message: "Model deleted successfully.",
				data: null,
			})
		);
	}

	/**
	 * Assign an uploaded image to a model
	 *
	 * @param userJwt - Authenticated user JWT payload
	 * @param subdomain - Company subdomain
	 * @param modelId - The model ID
	 * @param data - The image data
	 * @param response - Fastify reply
	 */
	static async createModelImage({
		userJwt,
		subdomain,
		modelId,
		data,
		response,
	}: {
		userJwt: { id: string; company?: { id: string; subdomain: string } };
		subdomain: string;
		modelId: string;
		data: z.infer<typeof createModelImageBodySchema>;
		response: FastifyReply;
	}) {
		if (!userJwt.company) {
			throw new AppError("MODEL_COMPANY_NOT_FOUND");
		}
		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("MODEL_NOT_ALLOWED");
		}

		const model = await ModelsRepository.queryModelBySlug(
			modelId,
			userJwt.company.id
		);
		if (!model) {
			throw new AppError("MODEL_NOT_FOUND");
		}

		const imageId = createId();
		const image = await ModelsRepository.insertModelImage({
			id: imageId,
			modelId: model.id as string,
			r2Key: data.r2Key,
			isPrimary: data.isPrimary ?? false,
			variant: data.variant ?? null,
			position: data.position ?? 0,
		});

		const [imageWithPresignedUrl] =
			await ModelsRepository.attachPresignedUrlsToImages([image!]);

		return response.status(201).send(
			apiResponse({
				status: 201,
				error: null,
				code: "create_model_image_success",
				message: "Model image created successfully.",
				data: imageWithPresignedUrl,
			})
		);
	}

	/**
	 * Delete a model image
	 *
	 * @param userJwt - Authenticated user JWT payload
	 * @param subdomain - Company subdomain
	 * @param modelId - The model ID
	 * @param imageId - The image ID
	 * @param response - Fastify reply
	 */
	static async deleteModelImage({
		userJwt,
		subdomain,
		modelId,
		imageId,
		response,
	}: {
		userJwt: { id: string; company?: { id: string; subdomain: string } };
		subdomain: string;
		modelId: string;
		imageId: string;
		response: FastifyReply;
	}) {
		if (!userJwt.company) {
			throw new AppError("MODEL_COMPANY_NOT_FOUND");
		}
		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("MODEL_NOT_ALLOWED");
		}

		const model = await ModelsRepository.queryModelBySlug(
			modelId,
			userJwt.company.id
		);
		if (!model) {
			throw new AppError("MODEL_NOT_FOUND");
		}

		const images = await ModelsRepository.queryModelImages(model.id as string);
		const image = images.find((img) => img.id === imageId);
		if (!image) {
			throw new AppError("MODEL_IMAGE_NOT_FOUND");
		}

		if (image.r2Key) {
			await ModelsRepository.deleteR2Object(image.r2Key);
		}
		await ModelsRepository.deleteModelImageRecord(imageId);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "delete_model_image_success",
				message: "Model image deleted successfully.",
				data: null,
			})
		);
	}
}
