import { permissions } from "@fixr/permissions";
import {
	apiKeyIdParamsSchema,
	createApiKeySchema,
} from "@fixr/schemas/api-keys";
import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import { getPaginatedDataSchema } from "@fixr/schemas/utils";
import type { z } from "zod";
import { apiKeysDocs } from "../../../core/docs/api-keys/api-keys.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployee } from "../../../core/middlewares/authenticate-employee";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { ApiKeysController } from "../controllers";

/** @description API keys routes plugin */
export function apiKeysRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.apiKeys.read),
			],
			schema: apiKeysDocs.listApiKeysSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;

			const { query, sort, page, perPage } = getPaginatedDataSchema.parse(
				request.query
			);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ApiKeysController.getCompanyApiKeys({
				subdomain,
				userJwt,
				response,
				page,
				perPage,
				query,
				sort,
			});
		})
	);

	fastify.post(
		"/",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.apiKeys.create),
			],
			schema: apiKeysDocs.createApiKeySchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const data = await createApiKeySchema.parseAsync(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ApiKeysController.createApiKey({
				userJwt,
				subdomain,
				data,
				response,
			});
		})
	);

	fastify.delete(
		"/:apiKeyId",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.apiKeys.revoke),
			],
			schema: apiKeysDocs.revokeApiKeySchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { apiKeyId } = apiKeyIdParamsSchema.parse(request.params);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ApiKeysController.revokeApiKey({
				userJwt,
				subdomain,
				apiKeyId,
				response,
			});
		})
	);
}
