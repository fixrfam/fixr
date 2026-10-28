import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	createCustomerSchema,
	customerIdParamsSchema,
	getCustomersQuerySchema,
	patchCustomerSchema,
} from "@fixr/schemas/customers";
import type { z } from "zod";
import { customersDocs } from "../../../core/docs/customers.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployeeOrApiKey } from "../../../core/middlewares/authenticate-employee-or-api-key";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { CustomersController } from "../controllers";

/** @description Customers routes plugin */
export function customersRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.customers.read),
			],
			schema: customersDocs.listCustomersSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const query = getCustomersQuerySchema.parse(request.query);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await CustomersController.listCustomers({
				userJwt,
				subdomain,
				response,
				...query,
			});
		})
	);

	fastify.get(
		"/:customerId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.customers.read),
			],
			schema: customersDocs.getCustomerSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { customerId } = customerIdParamsSchema.parse(request.params);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await CustomersController.getCustomer({
				userJwt,
				subdomain,
				customerId,
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
			schema: customersDocs.createCustomerSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const data = createCustomerSchema.parse(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await CustomersController.createCustomer({
				userJwt,
				subdomain,
				data,
				response,
			});
		})
	);

	fastify.patch(
		"/:customerId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.customers.update),
			],
			schema: customersDocs.patchCustomerSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { customerId } = customerIdParamsSchema.parse(request.params);
			const data = patchCustomerSchema.parse(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await CustomersController.patchCustomer({
				userJwt,
				subdomain,
				customerId,
				data,
				response,
			});
		})
	);

	fastify.delete(
		"/:customerId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.customers.delete),
			],
			schema: customersDocs.deleteCustomerSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { customerId } = customerIdParamsSchema.parse(request.params);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await CustomersController.deleteCustomer({
				userJwt,
				subdomain,
				customerId,
				response,
			});
		})
	);
}
