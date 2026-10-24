import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	createSupplierSchema,
	getSuppliersQuerySchema,
	patchSupplierSchema,
	supplierIdParamsSchema,
} from "@fixr/schemas/suppliers";
import type { z } from "zod";
import { suppliersDocs } from "../../../core/docs/suppliers.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployeeOrApiKey } from "../../../core/middlewares/authenticate-employee-or-api-key";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { SuppliersController } from "../controllers";

/** @description Suppliers routes plugin */
export function suppliersRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.suppliers.read),
			],
			schema: suppliersDocs.listSuppliersSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const query = getSuppliersQuerySchema.parse(request.query);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await SuppliersController.listSuppliers({
				userJwt,
				subdomain,
				response,
				...query,
			});
		})
	);

	fastify.get(
		"/:supplierId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.suppliers.read),
			],
			schema: suppliersDocs.getSupplierSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { supplierId } = supplierIdParamsSchema.parse(request.params);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await SuppliersController.getSupplier({
				userJwt,
				subdomain,
				supplierId,
				response,
			});
		})
	);

	fastify.post(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.suppliers.create),
			],
			schema: suppliersDocs.createSupplierSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const data = createSupplierSchema.parse(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await SuppliersController.createSupplier({
				userJwt,
				subdomain,
				data,
				response,
			});
		})
	);

	fastify.patch(
		"/:supplierId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.suppliers.update),
			],
			schema: suppliersDocs.patchSupplierSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { supplierId } = supplierIdParamsSchema.parse(request.params);
			const data = patchSupplierSchema.parse(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await SuppliersController.patchSupplier({
				userJwt,
				subdomain,
				supplierId,
				data,
				response,
			});
		})
	);

	fastify.delete(
		"/:supplierId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.suppliers.delete),
			],
			schema: suppliersDocs.deleteSupplierSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { supplierId } = supplierIdParamsSchema.parse(request.params);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await SuppliersController.deleteSupplier({
				userJwt,
				subdomain,
				supplierId,
				response,
			});
		})
	);
}
