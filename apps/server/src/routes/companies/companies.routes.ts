import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyBySubdomainSchema } from "@fixr/schemas/companies";
import type { z } from "zod";
import { getCompanyBySubdomainHandler } from "@/src/controllers/companies/get-company-by-id-handler";
import { getUserCompanyHandler } from "@/src/controllers/companies/get-user-company-handler";
import { companiesDocs } from "@/src/docs/companies/companies.docs";
import type { FastifyTypedInstance } from "@/src/interfaces/fastify";
import { authenticateEmployee } from "@/src/middlewares/authenticate-employee";
import { requirePermission } from "@/src/middlewares/rbac";
import { withErrorHandler } from "@/src/middlewares/with-error-handler";

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

			await getUserCompanyHandler({ userJwt, response });
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

			await getCompanyBySubdomainHandler({
				subdomain: params.subdomain,
				userJwt,
				response,
			});
		})
	);
}
