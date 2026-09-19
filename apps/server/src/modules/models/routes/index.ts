import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	createModelBodySchema,
	createModelImageBodySchema,
	getModelBySlugParamsSchema,
	getModelsQuerySchema,
	modelIdParamsSchema,
	modelImageParamsSchema,
	patchModelBodySchema,
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

	fastify.post(
		"/",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.devices.create),
			],
			schema: modelsDocs.createModelSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const data = createModelBodySchema.parse(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ModelsController.createModel({
				userJwt,
				subdomain,
				data,
				response,
			});
		})
	);

	fastify.patch(
		"/:modelId",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.devices.update),
			],
			schema: modelsDocs.patchModelSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { modelId } = modelIdParamsSchema.parse(request.params);
			const data = patchModelBodySchema.parse(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ModelsController.patchModel({
				userJwt,
				subdomain,
				modelId,
				data,
				response,
			});
		})
	);

	fastify.delete(
		"/:modelId",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.devices.delete),
			],
			schema: modelsDocs.deleteModelSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { modelId } = modelIdParamsSchema.parse(request.params);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ModelsController.deleteModel({
				userJwt,
				subdomain,
				modelId,
				response,
			});
		})
	);

	fastify.post(
		"/:modelId/images",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.devices.update),
			],
			schema: modelsDocs.createModelImageSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { modelId } = modelIdParamsSchema.parse(request.params);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const data = createModelImageBodySchema.parse(request.body);

			await ModelsController.createModelImage({
				userJwt,
				subdomain,
				modelId,
				data,
				response,
			});
		})
	);

	fastify.delete(
		"/:modelId/images/:imageId",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.devices.update),
			],
			schema: modelsDocs.deleteModelImageSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { modelId, imageId } = modelImageParamsSchema.parse(request.params);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ModelsController.deleteModelImage({
				userJwt,
				subdomain,
				modelId,
				imageId,
				response,
			});
		})
	);
}
