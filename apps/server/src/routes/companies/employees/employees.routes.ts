import { z } from "zod";
import { userJWT } from "@repo/schemas/auth";
import { authenticateEmployee } from "@/src/middlewares/authenticateEmployee";
import { FastifyTypedInstance } from "@/src/interfaces/fastify";
import { employeesDocs } from "@/src/docs/companies/employees/employees.docs";
import { getCompanyEmployeesHandler } from "@/src/controllers/companies/employees/getCompanyEmployeesHandler";
import { getCompanyNestedDataSchema } from "@repo/schemas/companies";
import { getPaginatedDataSchema } from "@repo/schemas/utils";
import { createEmployeeSchema } from "@repo/schemas/employees";
import { registerEmployeeHandler } from "@/src/controllers/companies/employees/registerEmployeeHandler";

export async function employeesRoutes(fastify: FastifyTypedInstance) {
    // Get company employees (paginated)
    fastify.get(
        "/",
        { preHandler: authenticateEmployee, schema: employeesDocs.getCompanyEmployeesSchema },
        async (request, response) => {
            const userJwt = request.user as z.infer<typeof userJWT>;
            const { query, sort, page, perPage } = getPaginatedDataSchema.parse(request.query);
            const { companyId } = getCompanyNestedDataSchema.parse(request.params);

            await getCompanyEmployeesHandler({
                companyId,
                userJwt,
                response,
                page,
                perPage,
                query,
                sort,
            });
        }
    );

    fastify.post(
        "/",
        { preHandler: authenticateEmployee, schema: employeesDocs.registerEmployeeSchema },
        async (request, response) => {
            const userJwt = request.user as z.infer<typeof userJWT>;
            const body = await createEmployeeSchema.parseAsync(request.body);
            const { companyId } = getCompanyNestedDataSchema.parse(request.params);

            await registerEmployeeHandler({ userJwt, data: body, companyId, response });
        }
    );
}
