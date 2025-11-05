import { userJWT } from '@fixr/schemas/auth'
import { getCompanyNestedDataSchema } from '@fixr/schemas/companies'
import { createEmployeeSchema } from '@fixr/schemas/employees'
import { getPaginatedDataSchema } from '@fixr/schemas/utils'
import { z } from 'zod'
import { getCompanyEmployeesHandler } from '@/src/controllers/companies/employees/getCompanyEmployeesHandler'
import { registerEmployeeHandler } from '@/src/controllers/companies/employees/registerEmployeeHandler'
import { employeesDocs } from '@/src/docs/companies/employees/employees.docs'
import { FastifyTypedInstance } from '@/src/interfaces/fastify'
import { authenticateEmployee } from '@/src/middlewares/authenticateEmployee'
import { withErrorHandler } from '@/src/middlewares/withErrorHandler'

export async function employeesRoutes(fastify: FastifyTypedInstance) {
  // Get company employees (paginated)
  fastify.get(
    '/',
    {
      preHandler: authenticateEmployee,
      schema: employeesDocs.getCompanyEmployeesSchema,
    },
    withErrorHandler(async (request, response) => {
      const userJwt = request.user as z.infer<typeof userJWT>
      const { query, sort, page, perPage } = getPaginatedDataSchema.parse(
        request.query,
      )
      const { subdomain } = getCompanyNestedDataSchema.parse(request.params)

      await getCompanyEmployeesHandler({
        subdomain,
        userJwt,
        response,
        page,
        perPage,
        query,
        sort,
      })
    }),
  )

  fastify.post(
    '/',
    {
      preHandler: authenticateEmployee,
      schema: employeesDocs.registerEmployeeSchema,
    },
    withErrorHandler(async (request, response) => {
      const userJwt = request.user as z.infer<typeof userJWT>
      const body = await createEmployeeSchema.parseAsync(request.body)
      const { subdomain } = getCompanyNestedDataSchema.parse(request.params)

      await registerEmployeeHandler({
        userJwt,
        data: body,
        subdomain,
        response,
      })
    }),
  )
}
