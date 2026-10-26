import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	addServiceOrderItemSchema,
	changeServiceOrderStatusSchema,
	createServiceOrderSchema,
	getServiceOrdersQuerySchema,
	patchServiceOrderItemSchema,
	patchServiceOrderSchema,
	serviceOrderIdParamsSchema,
	serviceOrderItemParamsSchema,
} from "@fixr/schemas/service-orders";
import type { z } from "zod";
import { serviceOrdersDocs } from "../../../core/docs/service-orders.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployeeOrApiKey } from "../../../core/middlewares/authenticate-employee-or-api-key";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { ServiceOrdersController } from "../controllers";

/** @description Service orders routes plugin */
export function serviceOrdersRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.serviceOrders.read),
			],
			schema: serviceOrdersDocs.getCompanyServiceOrdersSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const query = getServiceOrdersQuerySchema.parse(request.query);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ServiceOrdersController.getCompanyServiceOrders({
				userJwt,
				subdomain,
				response,
				...query,
			});
		})
	);

	fastify.post(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.serviceOrders.create),
			],
			schema: serviceOrdersDocs.createServiceOrderSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const body = await createServiceOrderSchema.parseAsync(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ServiceOrdersController.createServiceOrder({
				userJwt,
				data: body,
				subdomain,
				response,
			});
		})
	);

	fastify.get(
		"/:serviceOrderId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.serviceOrders.read),
			],
			schema: serviceOrdersDocs.getServiceOrderSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const { serviceOrderId } = serviceOrderIdParamsSchema.parse(
				request.params
			);

			await ServiceOrdersController.getServiceOrder({
				userJwt,
				subdomain,
				serviceOrderId,
				response,
			});
		})
	);

	fastify.patch(
		"/:serviceOrderId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.serviceOrders.update),
			],
			schema: serviceOrdersDocs.patchServiceOrderSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const { serviceOrderId } = serviceOrderIdParamsSchema.parse(
				request.params
			);
			const data = patchServiceOrderSchema.parse(request.body);

			await ServiceOrdersController.patchServiceOrder({
				userJwt,
				subdomain,
				serviceOrderId,
				data,
				response,
			});
		})
	);

	fastify.patch(
		"/:serviceOrderId/status",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.serviceOrders.changeStatus),
			],
			schema: serviceOrdersDocs.changeServiceOrderStatusSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const { serviceOrderId } = serviceOrderIdParamsSchema.parse(
				request.params
			);
			const data = changeServiceOrderStatusSchema.parse(request.body);

			await ServiceOrdersController.changeStatus({
				userJwt,
				subdomain,
				serviceOrderId,
				data,
				response,
			});
		})
	);

	fastify.get(
		"/:serviceOrderId/items",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.serviceOrders.read),
			],
			schema: serviceOrdersDocs.listServiceOrderItemsSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const { serviceOrderId } = serviceOrderIdParamsSchema.parse(
				request.params
			);

			await ServiceOrdersController.listItems({
				userJwt,
				subdomain,
				serviceOrderId,
				response,
			});
		})
	);

	fastify.post(
		"/:serviceOrderId/items",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.serviceOrders.update),
			],
			schema: serviceOrdersDocs.addServiceOrderItemSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const { serviceOrderId } = serviceOrderIdParamsSchema.parse(
				request.params
			);
			const data = addServiceOrderItemSchema.parse(request.body);

			await ServiceOrdersController.addItem({
				userJwt,
				subdomain,
				serviceOrderId,
				data,
				response,
			});
		})
	);

	fastify.patch(
		"/:serviceOrderId/items/:itemId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.serviceOrders.update),
			],
			schema: serviceOrdersDocs.patchServiceOrderItemSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const { serviceOrderId, itemId } = serviceOrderItemParamsSchema.parse(
				request.params
			);
			const data = patchServiceOrderItemSchema.parse(request.body);

			await ServiceOrdersController.patchItem({
				userJwt,
				subdomain,
				serviceOrderId,
				itemId,
				data,
				response,
			});
		})
	);

	fastify.delete(
		"/:serviceOrderId/items/:itemId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.serviceOrders.update),
			],
			schema: serviceOrdersDocs.deleteServiceOrderItemSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const { serviceOrderId, itemId } = serviceOrderItemParamsSchema.parse(
				request.params
			);

			await ServiceOrdersController.deleteItem({
				userJwt,
				subdomain,
				serviceOrderId,
				itemId,
				response,
			});
		})
	);
}
