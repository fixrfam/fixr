import { FastifyRequest } from "fastify";

import { getAccountHandler } from "../controllers/account/accountHandler";
import {
    confirmAccountDeletionHandler,
    requestAccountDeletionHandler,
} from "../controllers/account/deleteHandler";
import { confirmAccountDeletionSchema } from "@repo/schemas/account";
import { FastifyTypedInstance } from "../interfaces/fastify";
import { authenticate } from "../middlewares/authenticate";
import { accountDocs } from "../docs/account.docs";
import { z } from "zod";
import { userJWT } from "@repo/schemas/auth";

export async function accountRoutes(fastify: FastifyTypedInstance) {
    fastify.get(
        "/",
        { preHandler: authenticate, schema: accountDocs.getAccountSchema },
        async (request, response) => {
            const userJwt = request.user as z.infer<typeof userJWT>;

            await getAccountHandler({ userId: userJwt.id, response });
        }
    );

    fastify.post(
        "/request-deletion",
        { preHandler: authenticate, schema: accountDocs.requestDeletionSchema },
        async (request, response) => {
            const userJwt = request.user as z.infer<typeof userJWT>;

            await requestAccountDeletionHandler({ userId: userJwt.id, request, response });
        }
    );

    fastify.get(
        "/confirm-deletion",
        { schema: accountDocs.confirmDeletionSchema },
        async (
            request: FastifyRequest<{ Querystring: { token: string; redirectUrl?: string } }>,
            response
        ) => {
            const query = await confirmAccountDeletionSchema.parseAsync(request.query);
            const token = decodeURIComponent(query.token);

            await confirmAccountDeletionHandler({
                token,
                redirectUrl: query.redirectUrl,
                response,
            });
        }
    );
}
