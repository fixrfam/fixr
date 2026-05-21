import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import { createEmployeeSchema } from "@fixr/schemas/employees";
import { getPaginatedDataSchema } from "@fixr/schemas/utils";
import type { z } from "zod";
import { requirePermission } from "@/src/core/middlewares/rbac";
import { employeesDocs } from "../../../core/docs/companies/employees/employees.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployee } from "../../../core/middlewares/authenticate-employee";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { EmployeesController } from "../controllers";

/** @description Employees routes plugin */
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

			await EmployeesController.getCompanyEmployees({
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

			await EmployeesController.registerEmployee({
				userJwt,
				data: body,
				subdomain,
				response,
			});
		})
	);
}
