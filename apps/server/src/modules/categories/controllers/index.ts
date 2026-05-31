import type {
	getModelCategoriesQuerySchema,
	getModelCategoryParamsSchema,
} from "@fixr/schemas/models";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { CategoriesService } from "../services";

/** @description Categories request handlers */
export class CategoriesController {
	/** @description List all categories */
	static listCategories({
		query,
		response,
	}: {
		query?: string;
		response: FastifyReply;
	} & z.infer<typeof getModelCategoriesQuerySchema>) {
		return CategoriesService.listCategories({ query, response });
	}

	/** @description Get a category by slug */
	static getCategoryBySlug({
		slug,
		response,
	}: {
		slug: string;
		response: FastifyReply;
	} & z.infer<typeof getModelCategoryParamsSchema>) {
		return CategoriesService.getCategoryBySlug({ slug, response });
	}
}
