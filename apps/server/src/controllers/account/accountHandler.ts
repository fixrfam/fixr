import { accountSchema } from "@fixr/schemas/account"
import { FastifyReply } from "fastify"

import { apiResponse } from "@/src/helpers/response"
import { queryAccountById } from "../../services/account.services"

export async function getAccountHandler({
  userId,
  response,
}: {
  userId: string
  response: FastifyReply
}) {
  const account = await queryAccountById(userId)

  return response.status(200).send(
    apiResponse({
      status: 200,
      error: null,
      code: "get_account_success",
      message: "Account retrieved successfully.",
      data: accountSchema.parse(account),
    }),
  )
}
