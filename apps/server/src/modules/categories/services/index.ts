import { modelCategorySelectSchema } from "@fixr/db/schema";
import type { FastifyReply } from "fastify";
import { AppError } from "../../../core/lib/app-error";
import { apiResponse } from "../../../core/lib/response";
import { CategoriesRepository } from "../repositories";

/** @description Business logic for device categories */
export class CategoriesService {
	/**
	 * List all categories, optionally filtered by query
	 *
	 * @param query - Optional name filter
	 * @param response - Fastify reply
	 */
	static async listCategories({
		query,
		response,
	}: {
		query?: string;
		response: FastifyReply;
	}) {
		const categories = await CategoriesRepository.queryAllCategories(query);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "list_categories_success",
				message: "Categories retrieved successfully.",
				data: categories.map((c) => modelCategorySelectSchema.parse(c)),
			})
		);
	}

	/**
	 * Get a category by its slug
	 *
	 * @param slug - The category slug
	 * @param response - Fastify reply
	 */
	static async getCategoryBySlug({
		slug,
		response,
	}: {
		slug: string;
		response: FastifyReply;
	}) {
		const category = await CategoriesRepository.queryCategoryBySlug(slug);

		if (!category) {
			throw new AppError("CATEGORY_NOT_FOUND");
		}

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "get_category_success",
				message: "Category retrieved successfully.",
				data: modelCategorySelectSchema.parse(category),
			})
		);
	}
}
