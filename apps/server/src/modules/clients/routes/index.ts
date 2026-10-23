import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import {
	clientIdParamsSchema,
	createClientSchema,
	getClientsQuerySchema,
	patchClientSchema,
} from "@fixr/schemas/clients";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import type { z } from "zod";
import { clientsDocs } from "../../../core/docs/clients.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployeeOrApiKey } from "../../../core/middlewares/authenticate-employee-or-api-key";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { ClientsController } from "../controllers";

/** @description Clients routes plugin */
export function clientsRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.customers.read),
			],
			schema: clientsDocs.listClientsSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const query = getClientsQuerySchema.parse(request.query);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ClientsController.listClients({
				userJwt,
				subdomain,
				response,
				...query,
			});
		})
	);

	fastify.get(
		"/:clientId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.customers.read),
			],
			schema: clientsDocs.getClientSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { clientId } = clientIdParamsSchema.parse(request.params);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ClientsController.getClient({
				userJwt,
				subdomain,
				clientId,
				response,
			});
		})
	);

	fastify.post(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.customers.create),
			],
			schema: clientsDocs.createClientSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const data = createClientSchema.parse(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ClientsController.createClient({
				userJwt,
				subdomain,
				data,
				response,
			});
		})
	);

	fastify.patch(
		"/:clientId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.customers.update),
			],
			schema: clientsDocs.patchClientSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { clientId } = clientIdParamsSchema.parse(request.params);
			const data = patchClientSchema.parse(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ClientsController.patchClient({
				userJwt,
				subdomain,
				clientId,
				data,
				response,
			});
		})
	);

	fastify.delete(
		"/:clientId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.customers.delete),
			],
			schema: clientsDocs.deleteClientSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { clientId } = clientIdParamsSchema.parse(request.params);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await ClientsController.deleteClient({
				userJwt,
				subdomain,
				clientId,
				response,
			});
		})
	);
}
