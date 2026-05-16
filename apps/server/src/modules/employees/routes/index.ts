import { permissions } from "@fixr/permissions";
import type { jwtPayload } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import { createEmployeeSchema } from "@fixr/schemas/employees";
import { getPaginatedDataSchema } from "@fixr/schemas/utils";
import type { Context } from "elysia";
import type { z } from "zod";
import { requirePermission } from "@/src/core/middlewares/rbac";
import { employeesDocs } from "../../../core/docs/companies/employees/employees.docs";
import { authenticateEmployee } from "../../../core/middlewares/authenticate-employee";
import { EmployeesController } from "../controllers";

export function employeesRoutes(app: Elysia) {
	return app
		.get(
			"/companies/:subdomain/employees",
			(ctx: Context) => {
				const { query, sort, page, perPage } = getPaginatedDataSchema.parse(
					ctx.query
				);
				const { subdomain } = getCompanyNestedDataSchema.parse(ctx.params);
				const user = (ctx as Context & { user: z.infer<typeof jwtPayload> })
					.user;
				return EmployeesController.getCompanyEmployees({
					subdomain,
					userJwt: user,
					page,
					perPage,
					query,
					sort,
					ctx,
				});
			},
			{
				...employeesDocs.getCompanyEmployeesSchema,
				beforeHandle: [
					authenticateEmployee,
					requirePermission(permissions.employees.read),
				],
			}
		)
		.post(
			"/companies/:subdomain/employees",
			async (ctx: Context) => {
				const body = await createEmployeeSchema.parseAsync(ctx.body);
				const { subdomain } = getCompanyNestedDataSchema.parse(ctx.params);
				const user = (ctx as Context & { user: z.infer<typeof jwtPayload> })
					.user;
				return EmployeesController.registerEmployee({
					userJwt: user,
					data: body,
					subdomain,
					ctx,
				});
			},
			{
				...employeesDocs.registerEmployeeSchema,
				beforeHandle: [
					authenticateEmployee,
					requirePermission(permissions.employees.create),
				],
			}
		);
}
