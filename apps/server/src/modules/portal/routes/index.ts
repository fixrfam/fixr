import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import { rejectEstimateSchema } from "@fixr/schemas/estimates";
import {
	portalEstimateParamsSchema,
	portalServiceOrderParamsSchema,
	portalTokenSchema,
	requestPortalAccessSchema,
} from "@fixr/schemas/portal";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { portalDocs } from "../../../core/docs/portal.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { AppError } from "../../../core/lib/app-error";
import { requestLocale } from "../../../core/lib/locale";
import { authenticateEmployeeOrApiKey } from "../../../core/middlewares/authenticate-employee-or-api-key";
import {
	authenticatePortal,
	PORTAL_SESSION_COOKIE,
} from "../../../core/middlewares/authenticate-portal";
import { requirePermission } from "../../../core/middlewares/rbac";
import { requireTurnstile } from "../../../core/middlewares/turnstile";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { PortalController } from "../controllers";

/** Identity set by `authenticatePortal`. */
function identity(request: FastifyRequest) {
	if (!request.portal) {
		throw new AppError("PORTAL_UNAUTHORIZED");
	}
	const { cpf, email, customerId } = request.portal;
	return { cpf, email, customerId };
}

/**
 * @description Customer portal routes. Session routes are public (the emailed
 * token is the credential); the rest require the portal session cookie.
 */
export function portalRoutes(fastify: FastifyTypedInstance) {
	fastify.post(
		"/session",
		{ schema: portalDocs.openFromPortalLinkSchema },
		withErrorHandler(async (request, response) => {
			await PortalController.openFromPortalLink({
				token: portalTokenSchema.parse(request.body).token,
				response,
			});
		})
	);

	fastify.post(
		"/session/estimate",
		{ schema: portalDocs.openFromEstimateLinkSchema },
		withErrorHandler(async (request, response) => {
			await PortalController.openFromEstimateLink({
				token: portalTokenSchema.parse(request.body).token,
				response,
			});
		})
	);

	fastify.delete(
		"/session",
		{ schema: portalDocs.signOutSchema },
		withErrorHandler(async (request, response) => {
			await PortalController.signOut({
				token: request.cookies[PORTAL_SESSION_COOKIE],
				response,
			});
		})
	);

	fastify.post(
		"/access",
		{
			preHandler: [requireTurnstile()],
			schema: portalDocs.requestAccessSchema,
		},
		withErrorHandler(async (request, response) => {
			await PortalController.requestAccess({
				email: requestPortalAccessSchema.parse(request.body).email,
				locale: requestLocale(request),
				response,
			});
		})
	);

	fastify.get(
		"/me",
		{ preHandler: [authenticatePortal], schema: portalDocs.meSchema },
		withErrorHandler(async (request, response) => {
			await PortalController.me({ identity: identity(request), response });
		})
	);

	fastify.get(
		"/service-orders",
		{
			preHandler: [authenticatePortal],
			schema: portalDocs.listServiceOrdersSchema,
		},
		withErrorHandler(async (request, response) => {
			await PortalController.listServiceOrders({
				identity: identity(request),
				response,
			});
		})
	);

	fastify.get(
		"/service-orders/:serviceOrderId",
		{
			preHandler: [authenticatePortal],
			schema: portalDocs.getServiceOrderSchema,
		},
		withErrorHandler(async (request, response) => {
			await PortalController.getServiceOrder({
				identity: identity(request),
				serviceOrderId: portalServiceOrderParamsSchema.parse(request.params)
					.serviceOrderId,
				response,
			});
		})
	);

	fastify.get(
		"/estimates/:estimateId/pdf",
		{
			preHandler: [authenticatePortal],
			schema: portalDocs.getEstimatePdfSchema,
		},
		withErrorHandler(async (request, response) => {
			await PortalController.getEstimatePdf({
				identity: identity(request),
				estimateId: portalEstimateParamsSchema.parse(request.params).estimateId,
				locale: requestLocale(request),
				response,
			});
		})
	);

	fastify.post(
		"/estimates/:estimateId/approve",
		{
			preHandler: [authenticatePortal],
			schema: portalDocs.approveEstimateSchema,
		},
		withErrorHandler(async (request, response) => {
			await PortalController.approveEstimate({
				identity: identity(request),
				estimateId: portalEstimateParamsSchema.parse(request.params).estimateId,
				response,
			});
		})
	);

	fastify.post(
		"/estimates/:estimateId/reject",
		{
			preHandler: [authenticatePortal],
			schema: portalDocs.rejectEstimateSchema,
		},
		withErrorHandler(async (request, response) => {
			await PortalController.rejectEstimate({
				identity: identity(request),
				estimateId: portalEstimateParamsSchema.parse(request.params).estimateId,
				reason: rejectEstimateSchema.parse(request.body ?? {}).reason,
				response,
			});
		})
	);
}

/** @description Shop-side portal routes, under `/companies/:subdomain/customers`. */
export function customerPortalAccessRoutes(fastify: FastifyTypedInstance) {
	fastify.post(
		"/:customerId/portal-access",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.customers.update),
			],
			schema: portalDocs.sendAccessSchema,
		},
		withErrorHandler(async (request, response) => {
			const params = getCompanyNestedDataSchema
				.extend({ customerId: z.string() })
				.parse(request.params);

			await PortalController.sendAccess({
				userJwt: request.user as z.infer<typeof userJWT>,
				subdomain: params.subdomain,
				customerId: params.customerId,
				locale: requestLocale(request),
				response,
			});
		})
	);
}
