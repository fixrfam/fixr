import { permissions } from "@fixr/permissions";
import {
	getModelMakerParamsSchema,
	getModelMakersQuerySchema,
} from "@fixr/schemas/models";
import { makersDocs } from "../../../core/docs/makers/makers.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployeeOrApiKey } from "../../../core/middlewares/authenticate-employee-or-api-key";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { MakersController } from "../controllers";

/** @description Makers routes plugin */
export function makersRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.devices.read),
			],
			schema: makersDocs.listMakersSchema,
		},
		withErrorHandler(async (request, response) => {
			const { query, sort, page, perPage } = getModelMakersQuerySchema.parse(
				request.query
			);

			await MakersController.listMakers({
				page,
				perPage,
				query,
				sort,
				response,
			});
		})
	);

	fastify.get(
		"/:slug",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.devices.read),
			],
			schema: makersDocs.getMakerBySlugSchema,
		},
		withErrorHandler(async (request, response) => {
			const { slug } = getModelMakerParamsSchema.parse(request.params);

			await MakersController.getMakerBySlug({ slug, response });
		})
	);
}
