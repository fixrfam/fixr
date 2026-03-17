import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import { createEmployeeSchema } from "@fixr/schemas/employees";
import { getPaginatedDataSchema } from "@fixr/schemas/utils";
import type { z } from "zod";
import { getCompanyEmployeesHandler } from "@/src/controllers/companies/employees/get-company-employees-handler";
import { registerEmployeeHandler } from "@/src/controllers/companies/employees/register-employee-handler";
import { employeesDocs } from "@/src/docs/companies/employees/employees.docs";
import type { FastifyTypedInstance } from "@/src/interfaces/fastify";
import { authenticateEmployee } from "@/src/middlewares/authenticate-employee";
import { requirePermission } from "@/src/middlewares/rbac";
import { withErrorHandler } from "@/src/middlewares/with-error-handler";

export function employeesRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.employees.read),
			],
			schema: employeesDocs.getCompanyEmployeesSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;

			const { query, sort, page, perPage } = getPaginatedDataSchema.parse(
				request.query
			);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await getCompanyEmployeesHandler({
				subdomain,
				userJwt,
				response,
				page,
				perPage,
				query,
				sort,
			});
		})
	);

	fastify.post(
		"/",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.employees.create),
			],
			schema: employeesDocs.registerEmployeeSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const body = await createEmployeeSchema.parseAsync(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await registerEmployeeHandler({
				userJwt,
				data: body,
				subdomain,
				response,
			});
		})
	);
}
