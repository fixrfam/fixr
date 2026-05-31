import { permissions } from "@fixr/permissions";
import {
	getModelCategoriesQuerySchema,
	getModelCategoryParamsSchema,
} from "@fixr/schemas/models";
import { categoriesDocs } from "../../../core/docs/categories/categories.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployee } from "../../../core/middlewares/authenticate-employee";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { CategoriesController } from "../controllers";

/** @description Categories routes plugin */
export function categoriesRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.devices.read),
			],
			schema: categoriesDocs.listCategoriesSchema,
		},
		withErrorHandler(async (request, response) => {
			const { query } = getModelCategoriesQuerySchema.parse(request.query);

			await CategoriesController.listCategories({ query, response });
		})
	);

	fastify.get(
		"/:slug",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.devices.read),
			],
			schema: categoriesDocs.getCategoryBySlugSchema,
		},
		withErrorHandler(async (request, response) => {
			const { slug } = getModelCategoryParamsSchema.parse(request.params);

			await CategoriesController.getCategoryBySlug({ slug, response });
		})
	);
}
