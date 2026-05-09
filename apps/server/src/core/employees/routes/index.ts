import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import { createEmployeeSchema } from "@fixr/schemas/employees";
import { getPaginatedDataSchema } from "@fixr/schemas/utils";
import type { z } from "zod";
import { employeesDocs } from "../../docs/companies/employees/employees.docs";
import type { FastifyTypedInstance } from "../../interfaces/fastify";
import { authenticateEmployee } from "../../middlewares/authenticate-employee";
import { withErrorHandler } from "../../middlewares/with-error-handler";
import { EmployeesController } from "../controllers";

/** @description Employees routes plugin */
export function employeesRoutes(fastify: FastifyTypedInstance) {
	// Get company employees (paginated)
	fastify.get(
		"/",
		{
			preHandler: authenticateEmployee,
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
			preHandler: authenticateEmployee,
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
