import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	createServiceSchema,
	getServicesQuerySchema,
	patchServiceSchema,
	serviceIdParamsSchema,
} from "@fixr/schemas/services";
import type { z } from "zod";
import { servicesDocs } from "../../../core/docs/services.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployeeOrApiKey } from "../../../core/middlewares/authenticate-employee-or-api-key";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { ServicesController } from "../controllers";

/** @description Services routes plugin */
export function servicesRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.services.read),
			],
			schema: servicesDocs.listServicesSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const query = getServicesQuerySchema.parse(request.query);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ServicesController.listServices({
				userJwt,
				subdomain,
				response,
				...query,
			});
		})
	);

	fastify.get(
		"/:serviceId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.services.read),
			],
			schema: servicesDocs.getServiceSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { serviceId } = serviceIdParamsSchema.parse(request.params);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ServicesController.getService({
				userJwt,
				subdomain,
				serviceId,
				response,
			});
		})
	);

	fastify.post(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.services.create),
			],
			schema: servicesDocs.createServiceSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const data = createServiceSchema.parse(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ServicesController.createService({
				userJwt,
				subdomain,
				data,
				response,
			});
		})
	);

	fastify.patch(
		"/:serviceId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.services.update),
			],
			schema: servicesDocs.patchServiceSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { serviceId } = serviceIdParamsSchema.parse(request.params);
			const data = patchServiceSchema.parse(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ServicesController.patchService({
				userJwt,
				subdomain,
				serviceId,
				data,
				response,
			});
		})
	);

	fastify.delete(
		"/:serviceId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.services.delete),
			],
			schema: servicesDocs.deleteServiceSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { serviceId } = serviceIdParamsSchema.parse(request.params);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ServicesController.deleteService({
				userJwt,
				subdomain,
				serviceId,
				response,
			});
		})
	);
}
