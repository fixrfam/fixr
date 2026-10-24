import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	adjustPartStockSchema,
	createPartSchema,
	getPartsQuerySchema,
	partIdParamsSchema,
	patchPartSchema,
} from "@fixr/schemas/parts";
import type { z } from "zod";
import { partsDocs } from "../../../core/docs/parts.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployeeOrApiKey } from "../../../core/middlewares/authenticate-employee-or-api-key";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { PartsController } from "../controllers";

/** @description Parts routes plugin */
export function partsRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.parts.read),
			],
			schema: partsDocs.listPartsSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const query = getPartsQuerySchema.parse(request.query);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await PartsController.listParts({
				userJwt,
				subdomain,
				response,
				...query,
			});
		})
	);

	fastify.get(
		"/:partId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.parts.read),
			],
			schema: partsDocs.getPartSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { partId } = partIdParamsSchema.parse(request.params);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await PartsController.getPart({
				userJwt,
				subdomain,
				partId,
				response,
			});
		})
	);

	fastify.post(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.parts.create),
			],
			schema: partsDocs.createPartSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const data = createPartSchema.parse(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await PartsController.createPart({
				userJwt,
				subdomain,
				data,
				response,
			});
		})
	);

	fastify.patch(
		"/:partId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.parts.update),
			],
			schema: partsDocs.patchPartSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { partId } = partIdParamsSchema.parse(request.params);
			const data = patchPartSchema.parse(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await PartsController.patchPart({
				userJwt,
				subdomain,
				partId,
				data,
				response,
			});
		})
	);

	fastify.post(
		"/:partId/stock-adjustments",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.inventory.adjust),
			],
			schema: partsDocs.adjustPartStockSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { partId } = partIdParamsSchema.parse(request.params);
			const data = adjustPartStockSchema.parse(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await PartsController.adjustStock({
				userJwt,
				subdomain,
				partId,
				data,
				response,
			});
		})
	);

	fastify.delete(
		"/:partId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.parts.delete),
			],
			schema: partsDocs.deletePartSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { partId } = partIdParamsSchema.parse(request.params);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await PartsController.deletePart({
				userJwt,
				subdomain,
				partId,
				response,
			});
		})
	);
}
