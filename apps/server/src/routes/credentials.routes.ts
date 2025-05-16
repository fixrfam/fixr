import { changePasswordAuthenticatedHandler } from "../controllers/credentials/changePasswordAuthenticatedHandler";
import { credentialDocs } from "../docs/credentials.docs";
import {
    changePasswordAuthenticatedSchema,
    requestPasswordResetSchema,
    confirmPasswordResetSchema,
} from "@fixr/schemas/credentials";
import { FastifyTypedInstance } from "../interfaces/fastify";
import { authenticate } from "../middlewares/authenticate";
import { userJWT } from "@fixr/schemas/auth";
import { z } from "zod";
import {
    confirmPasswordResetHandler,
    requestPasswordResetHandler,
    validatePasswordResetTokenHandler,
} from "../controllers/credentials/passwordResetHandler";
import { FastifyRequest } from "fastify";

export async function credentialsRoutes(fastify: FastifyTypedInstance) {
    fastify.put(
        "/password",
        { preHandler: authenticate, schema: credentialDocs.changePasswordAuthenticatedSchema },
        async (request, response) => {
            const userJwt = request.user as z.infer<typeof userJWT>;
            const body = changePasswordAuthenticatedSchema.parse(request.body);

            await changePasswordAuthenticatedHandler({ user: userJwt, body, response });
        }
    );

    fastify.post(
        "/password/reset",
        { schema: credentialDocs.requestPasswordResetSchema },
        async (request, response) => {
            const body = requestPasswordResetSchema.parse(request.body);
            await requestPasswordResetHandler({ email: body.email, response });
        }
    );

    fastify.put(
        "/password/reset",
        { schema: credentialDocs.confirmPasswordResetSchema },
        async (request, response) => {
            const body = confirmPasswordResetSchema.parse(request.body);
            await confirmPasswordResetHandler({ body, response });
        }
    );

    fastify.get(
        "/password/reset",
        { schema: credentialDocs.validatePasswordResetTokenSchema },
        async (request: FastifyRequest<{ Querystring: { token: string } }>, response) => {
            const query = await z.object({ token: z.string() }).parseAsync(request.query);
            const token = decodeURIComponent(query.token);

            await validatePasswordResetTokenHandler({ token, response });
        }
    );
}
