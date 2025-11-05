import { confirmAccountDeletionSchema } from "@fixr/schemas/account"
import { userJWT } from "@fixr/schemas/auth"
import { FastifyRequest } from "fastify"
import { z } from "zod"
import { getAccountHandler } from "../controllers/account/accountHandler"
import {
  confirmAccountDeletionHandler,
  requestAccountDeletionHandler,
} from "../controllers/account/deleteHandler"
import { accountDocs } from "../docs/account.docs"
import { FastifyTypedInstance } from "../interfaces/fastify"
import { authenticate } from "../middlewares/authenticate"
import { withErrorHandler } from "../middlewares/withErrorHandler"

export async function accountRoutes(fastify: FastifyTypedInstance) {
  fastify.get(
    "/",
    { preHandler: authenticate, schema: accountDocs.getAccountSchema },
    withErrorHandler(async (request, response) => {
      const userJwt = request.user as z.infer<typeof userJWT>

      await getAccountHandler({ userId: userJwt.id, response })
    }),
  )

  fastify.post(
    "/request-deletion",
    { preHandler: authenticate, schema: accountDocs.requestDeletionSchema },
    withErrorHandler(async (request, response) => {
      const userJwt = request.user as z.infer<typeof userJWT>

      await requestAccountDeletionHandler({
        userId: userJwt.id,
        request,
        response,
      })
    }),
  )

  fastify.get(
    "/confirm-deletion",
    { schema: accountDocs.confirmDeletionSchema },
    withErrorHandler(
      async (
        request: FastifyRequest<{
          Querystring: { token: string; redirectUrl?: string }
        }>,
        response,
      ) => {
        const query = await confirmAccountDeletionSchema.parseAsync(
          request.query,
        )
        const token = decodeURIComponent(query.token)

        await confirmAccountDeletionHandler({
          token,
          redirectUrl: query.redirectUrl,
          response,
        })
      },
    ),
  )
}
