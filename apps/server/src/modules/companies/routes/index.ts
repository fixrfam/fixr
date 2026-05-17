import { permissions } from "@fixr/permissions";
import type { jwtPayload } from "@fixr/schemas/auth";
import { getCompanyBySubdomainSchema } from "@fixr/schemas/companies";
import type { Context, Elysia } from "elysia";
import type { z } from "zod";
import { companiesDocs } from "../../../core/docs/companies/companies.docs";
import { authenticateEmployee } from "../../../core/middlewares/authenticate-employee";
import { requirePermission } from "../../../core/middlewares/rbac";
import { CompaniesController } from "../controllers";

/** @description Companies routes plugin */
export function companiesRoutes(app: Elysia) {
	return app
		.get(
			"/companies",
			(ctx) => {
				const user = (ctx as Context & { user: z.infer<typeof jwtPayload> })
					.user;
				return CompaniesController.getUserCompany({ userJwt: user, ctx });
			},
			{
				...companiesDocs.getUserCompanySchema,
				beforeHandle: [
					authenticateEmployee,
					requirePermission(permissions.companies.read),
				],
			}
		)
		.get(
			"/companies/:subdomain",
			async (ctx: Context) => {
				const params = await getCompanyBySubdomainSchema.parseAsync(ctx.params);
				const user = (ctx as Context & { user: z.infer<typeof jwtPayload> })
					.user;
				return CompaniesController.getCompanyBySubdomain({
					subdomain: params.subdomain,
					userJwt: user,
					ctx,
				});
			},
			{
				...companiesDocs.getCompanyByIdSchema,
				beforeHandle: [
					authenticateEmployee,
					requirePermission(permissions.companies.read),
				],
			}
		);
}
