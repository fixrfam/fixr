import { userJWT } from '@fixr/schemas/auth'
import { getCompanyBySubdomainSchema } from '@fixr/schemas/companies'
import { z } from 'zod'
import { getCompanyBySubdomainHandler } from '@/src/controllers/companies/getCompanyByIdHandler'
import { getUserCompanyHandler } from '@/src/controllers/companies/getUserCompanyHandler'
import { companiesDocs } from '@/src/docs/companies/companies.docs'
import { FastifyTypedInstance } from '@/src/interfaces/fastify'
import { authenticateEmployee } from '@/src/middlewares/authenticateEmployee'
import { withErrorHandler } from '@/src/middlewares/withErrorHandler'

export async function companiesRoutes(fastify: FastifyTypedInstance) {
  fastify.get(
    '/',
    {
      preHandler: authenticateEmployee,
      schema: companiesDocs.getUserCompanySchema,
    },
    withErrorHandler(async (request, response) => {
      const userJwt = request.user as z.infer<typeof userJWT>

      await getUserCompanyHandler({ userJwt, response })
    }),
  )

  fastify.get(
    '/:subdomain',
    {
      preHandler: authenticateEmployee,
      schema: companiesDocs.getCompanyByIdSchema,
    },
    withErrorHandler(async (request, response) => {
      const userJwt = request.user as z.infer<typeof userJWT>
      const params = await getCompanyBySubdomainSchema.parseAsync(
        request.params,
      )

      await getCompanyBySubdomainHandler({
        subdomain: params.subdomain,
        userJwt,
        response,
      })
    }),
  )
}
