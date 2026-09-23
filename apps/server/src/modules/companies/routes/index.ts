import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import {
	createCompanySchema,
	getCompanyBySubdomainSchema,
} from "@fixr/schemas/companies";
import type { z } from "zod";
import { companiesDocs } from "../../../core/docs/companies/companies.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { requestLocale } from "../../../core/lib/locale";
import { authenticateAdmin } from "../../../core/middlewares/authenticate-admin";
import { authenticateEmployeeOrApiKey } from "../../../core/middlewares/authenticate-employee-or-api-key";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { CompaniesController } from "../controllers";

/** @description Companies routes plugin */
export function companiesRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
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
				authenticateEmployeeOrApiKey,
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

	fastify.post(
		"/",
		{
			preHandler: [authenticateAdmin],
			schema: companiesDocs.createCompanySchema,
		},
		withErrorHandler(async (request, response) => {
			request.log.info(
				{
					body: request.body,
					bodyType: typeof request.body,
					bodyJson: JSON.stringify(request.body),
				},
				"create-company body"
			);

			const body = await createCompanySchema.parseAsync(request.body);

			await CompaniesController.createCompany({
				body,
				locale: requestLocale(request),
				response,
			});
		})
	);
}
