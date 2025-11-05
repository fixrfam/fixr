import { companySelectSchema } from '@fixr/db/schema'
import { jwtPayload } from '@fixr/schemas/auth'
import { FastifyReply } from 'fastify'
import { z } from 'zod'
import { apiResponse } from '@/src/helpers/response'
import { queryCompanyById } from '@/src/services/companies/companies.services'

export async function getUserCompanyHandler({
  userJwt,
  response,
}: {
  userJwt: z.infer<typeof jwtPayload>
  response: FastifyReply
}) {
  if (!userJwt.company) {
    return response.status(404).send(
      apiResponse({
        status: 404,
        error: null,
        code: 'company_not_found',
        message: "There's no companies bound to your account",
        data: null,
      }),
    )
  }

  const company = await queryCompanyById(userJwt.company.id)

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
