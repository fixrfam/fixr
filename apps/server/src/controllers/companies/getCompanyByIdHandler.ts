import { companySelectSchema } from '@fixr/db/schema'
import { jwtPayload } from '@fixr/schemas/auth'
import { FastifyReply } from 'fastify'
import { z } from 'zod'
import { apiResponse } from '@/src/helpers/response'
import { queryCompanyBySubdomain } from '@/src/services/companies/companies.services'

export async function getCompanyBySubdomainHandler({
  subdomain,
  userJwt,
  response,
}: {
  subdomain: string
  userJwt: z.infer<typeof jwtPayload>
  response: FastifyReply
}) {
  if (subdomain !== userJwt.company?.subdomain) {
    return response.status(403).send(
      apiResponse({
        status: 403,
        error: 'Forbidden',
        code: 'not_allowed',
        message: 'You are not authorized to access this company.',
        data: null,
      }),
    )
  }

  const company = await queryCompanyBySubdomain(subdomain)

  if (!company) {
    return response.status(404).send(
      apiResponse({
        status: 404,
        error: 'Not Found',
        code: 'company_not_found',
        message: 'Company not found',
        data: null,
      }),
    )
  }

  return response.status(200).send(
    apiResponse({
      status: 200,
      error: null,
      code: 'get_company_success',
      message: 'Company retrieved successfully.',
      data: companySelectSchema.parse(company),
    }),
  )
}
