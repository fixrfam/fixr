import { FastifyRequest } from "fastify";

import { loginHandler } from "../controllers/auth/loginHandler";
import { registerHandler } from "../controllers/auth/registerHandler";
import { revalidateHandler } from "../controllers/auth/revalidateHandler";
import { verifyHandler } from "../controllers/auth/verifyHandler";
import { authDocs } from "../docs/auth.docs";
import { createUserSchema, loginUserSchema, verifyEmailSchema } from "@fixr/schemas/auth";
import { FastifyTypedInstance } from "../interfaces/fastify";
import { signOutHandler } from "../controllers/auth/signOutHandler";
import { cookieKey } from "@fixr/constants/cookies";
import { withErrorHandler } from "../middlewares/withErrorHandler";

export async function authRoutes(fastify: FastifyTypedInstance) {
    fastify.post(
        "/register",
        {
            schema: authDocs.registerSchema,
        },
        withErrorHandler(async (request, response) => {
            const body = await createUserSchema.parseAsync(request.body);

            await registerHandler({ body, request, response });
        })
    );

    fastify.post(
        "/login",
        { schema: authDocs.loginSchema },
        withErrorHandler(async (request, response) => {
            const body = await loginUserSchema.parseAsync(request.body);

            await loginHandler({ body, response });
        })
    );

    fastify.get(
        "/verify",
        { schema: authDocs.verifySchema },
        withErrorHandler(
            async (
                request: FastifyRequest<{ Querystring: { token: string; redirectUrl?: string } }>,
                response
            ) => {
                const query = await verifyEmailSchema.parseAsync(request.query);
                const token = decodeURIComponent(query.token);

                await verifyHandler({ token, redirectUrl: query.redirectUrl, response });
            }
        )
    );

    fastify.get(
        "/signout",
        { schema: authDocs.signOutSchema },
        withErrorHandler(async (request, response) => {
            const refreshToken = request.cookies[cookieKey("refreshToken")];

            await signOutHandler({ refreshToken, response });
        })
    );

    fastify.post(
        "/token",
        { schema: authDocs.revalidateSchema },
        withErrorHandler(async (request, response) => {
            const refreshToken = request.cookies[cookieKey("refreshToken")];

            await revalidateHandler({ refreshToken, response });
        })
    );
}
