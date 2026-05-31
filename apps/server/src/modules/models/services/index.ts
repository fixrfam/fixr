import { models } from "@fixr/db/schema";
import type { FastifyReply } from "fastify";
import { AppError } from "../../../core/lib/app-error";
import {
	getPaginatedCount,
	getPaginatedRecords,
} from "../../../core/lib/pagination";
import { apiResponse, paginatedData } from "../../../core/lib/response";
import {
	ModelsRepository,
	modelListJoins,
	modelMinimalListSelect,
} from "../repositories";

/** @description Business logic for device models */
export class ModelsService {
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

		const recordsWithImages = await Promise.all(
			(records as Record<string, unknown>[]).map((r) =>
				ModelsRepository.attachPresignedImageUrls(r)
			)
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

		const [modelWithPresignedUrl, imagesWithPresignedUrls] = await Promise.all([
			ModelsRepository.attachPresignedImageUrls(
				model as Record<string, unknown>
			),
			ModelsRepository.attachPresignedUrlsToImages(
				images as Record<string, unknown>[]
			),
		]);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "get_model_success",
				message: "Model retrieved successfully.",
				data: { ...modelWithPresignedUrl, images: imagesWithPresignedUrls },
			})
		);
	}
}
