import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyBySubdomainSchema } from "@fixr/schemas/companies";
import type { z } from "zod";
import { requirePermission } from "@/src/core/middlewares/rbac";
import { companiesDocs } from "../../../core/docs/companies/companies.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployee } from "../../../core/middlewares/authenticate-employee";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { CompaniesController } from "../controllers";

/** @description Companies routes plugin */
export function companiesRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.companies.read),
			],
			schema: companiesDocs.getUserCompanySchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;

			await CompaniesController.getUserCompany({ userJwt, response });
		})
	);

	fastify.get(
		"/:subdomain",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.companies.read),
			],
			schema: companiesDocs.getCompanyByIdSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const params = await getCompanyBySubdomainSchema.parseAsync(
				request.params
			);

			await CompaniesController.getCompanyBySubdomain({
				subdomain: params.subdomain,
				userJwt,
				response,
			});
		})
	);
}
