import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	createEstimateSchema,
	estimateIdParamsSchema,
	getEstimatesQuerySchema,
	patchEstimateSchema,
	updateEstimateStatusSchema,
} from "@fixr/schemas/estimates";
import type { FastifyRequest } from "fastify";
import type { z } from "zod";
import { estimatesDocs } from "../../../core/docs/estimates.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { requestLocale } from "../../../core/lib/locale";
import { authenticateEmployeeOrApiKey } from "../../../core/middlewares/authenticate-employee-or-api-key";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { EstimatesController } from "../controllers";

/** Session, company and estimate id of a request on `/:estimateId` routes. */
function estimateRequest(request: FastifyRequest) {
	return {
		userJwt: request.user as z.infer<typeof userJWT>,
		subdomain: getCompanyNestedDataSchema.parse(request.params).subdomain,
		estimateId: estimateIdParamsSchema.parse(request.params).estimateId,
	};
}

/** @description Estimates routes plugin */
export function estimatesRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.estimates.read),
			],
			schema: estimatesDocs.listEstimatesSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const query = getEstimatesQuerySchema.parse(request.query);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await EstimatesController.listEstimates({
				userJwt,
				subdomain,
				response,
				...query,
			});
		})
	);

	fastify.get(
		"/:estimateId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.estimates.read),
			],
			schema: estimatesDocs.getEstimateSchema,
		},
		withErrorHandler(async (request, response) => {
			await EstimatesController.getEstimate({
				...estimateRequest(request),
				response,
			});
		})
	);

	fastify.get(
		"/:estimateId/pdf",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.estimates.read),
			],
			schema: estimatesDocs.getEstimatePdfSchema,
		},
		withErrorHandler(async (request, response) => {
			await EstimatesController.getEstimatePdf({
				...estimateRequest(request),
				locale: requestLocale(request),
				response,
			});
		})
	);

	fastify.post(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.estimates.create),
			],
			schema: estimatesDocs.createEstimateSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const data = createEstimateSchema.parse(request.body);

			await EstimatesController.createEstimate({
				userJwt,
				subdomain,
				data,
				response,
			});
		})
	);

	fastify.patch(
		"/:estimateId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.estimates.update),
			],
			schema: estimatesDocs.patchEstimateSchema,
		},
		withErrorHandler(async (request, response) => {
			await EstimatesController.patchEstimate({
				...estimateRequest(request),
				data: patchEstimateSchema.parse(request.body),
				response,
			});
		})
	);

	fastify.patch(
		"/:estimateId/status",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.estimates.update),
			],
			schema: estimatesDocs.updateEstimateStatusSchema,
		},
		withErrorHandler(async (request, response) => {
			await EstimatesController.updateStatus({
				...estimateRequest(request),
				status: updateEstimateStatusSchema.parse(request.body).status,
				response,
			});
		})
	);

	fastify.delete(
		"/:estimateId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.estimates.delete),
			],
			schema: estimatesDocs.deleteEstimateSchema,
		},
		withErrorHandler(async (request, response) => {
			await EstimatesController.deleteEstimate({
				...estimateRequest(request),
				response,
			});
		})
	);
}
