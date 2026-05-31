import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	getModelBySlugParamsSchema,
	getModelsQuerySchema,
} from "@fixr/schemas/models";
import type { z } from "zod";
import { modelsDocs } from "../../../core/docs/models/models.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployee } from "../../../core/middlewares/authenticate-employee";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { ModelsController } from "../controllers";

/** @description Models routes plugin */
export function modelsRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.devices.read),
			],
			schema: modelsDocs.listModelsSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const query = getModelsQuerySchema.parse(request.query);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ModelsController.listModels({
				userJwt,
				subdomain,
				response,
				...query,
			});
		})
	);

	fastify.get(
		"/:slug",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.devices.read),
			],
			schema: modelsDocs.getModelBySlugSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { slug } = getModelBySlugParamsSchema.parse(request.params);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ModelsController.getModelBySlug({
				userJwt,
				subdomain,
				slug,
				response,
			});
		})
	);
}
