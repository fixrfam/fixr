import { env } from "@/src/env";
import { hashPassword } from "@/src/helpers/hash-password";
import { emailDisplayName } from "@fixr/mail/services";
import { createEmailQueue, queueEmail } from "@fixr/mail/queue";
import { apiResponse } from "@/src/helpers/response";
import { queryUserByEmail } from "@/src/services/auth.services";
import { updateUserPassword } from "@/src/services/credentials.services";
import {
    createOneTimeToken,
    deleteOneTimeToken,
    deleteUserExpiredTokensByEmail,
    getUserOneTimeTokensWithEmail,
    queryOneTimeToken,
} from "@/src/services/tokens.services";
import { confirmPasswordResetSchema } from "@fixr/schemas/credentials";
import { FastifyReply } from "fastify";
import { z } from "zod";
import { APP_NAME } from "@fixr/constants/app";
import { redis } from "@/src/config/redis";

export async function requestPasswordResetHandler({
    email,
    response,
}: {
    email: string;
    response: FastifyReply;
}) {
    await deleteUserExpiredTokensByEmail(email);
    const oneTimeTokens = await getUserOneTimeTokensWithEmail(email);

    for (const token of oneTimeTokens) {
        if (token.tokenType === "password_reset") {
            return response.status(409).send(
                apiResponse({
                    status: 409,
                    error: "Conflict",
                    code: "existing_password_reset_request",
                    message:
                        "Password reset request already exists. Finish it or wait until expiration (30 minutes from request) to issue a new one.",
                    data: null,
                })
            );
        }
    }

    const user = await queryUserByEmail(email);

    if (!user) {
        return response.status(404).send(
            apiResponse({
                status: 404,
                error: "Not Found",
                code: "user_not_found",
                message: "User not found",
                data: null,
            })
        );
    }

    const oneTimeToken = await createOneTimeToken({
        userId: user.id,
        email: user.email,
        tokenType: "password_reset",
    });

    const verificationUrl = `${env.FRONTEND_URL}/auth/forgot-password/${encodeURIComponent(oneTimeToken.token)}`;

    const emailQueue = createEmailQueue(redis);

    await queueEmail(emailQueue, {
        job: "sendPasswordResetEmail",
        payload: {
            to: user.email,
            appName: APP_NAME,
            verificationUrl: verificationUrl,
            displayName: user.displayName ?? emailDisplayName(user.email),
        },
    });

    return response.status(201).send(
        apiResponse({
            status: 201,
            error: null,
            code: "password_reset_request_accepted",
            message: "Reset request accepted, confirm email.",
            data: null,
        })
    );
}

export async function confirmPasswordResetHandler({
    body,
    response,
}: {
    body: z.infer<typeof confirmPasswordResetSchema>;
    response: FastifyReply;
}) {
    const oneTimeToken = await queryOneTimeToken(body.token);

    //Checks if the token exists, if it's not expired and if it's a deletion token
    if (!oneTimeToken) {
        return response.status(404).send(
            apiResponse({
                status: 404,
                error: "Not Found",
                code: "token_not_found",
                message: "Token not found",
                data: null,
            })
        );
    }
    if (oneTimeToken.expiresAt < new Date()) {
        return response.status(410).send(
            apiResponse({
                status: 410,
                error: "Gone",
                code: "token_expired",
                message: "Token expired",
                data: null,
            })
        );
    }
    if (oneTimeToken.tokenType !== "password_reset") {
        return response.status(400).send(
            apiResponse({
                status: 400,
                error: "Bad Request",
                code: "invalid_token",
                message: "Invalid token",
                data: null,
            })
        );
    }

    const hashedPassword = await hashPassword(body.password);

    await updateUserPassword(oneTimeToken.user.id, hashedPassword);

    await deleteOneTimeToken(oneTimeToken.token);

    return response.status(200).send(
        apiResponse({
            status: 200,
            error: null,
            code: "password_update_success",
            message: "Password updated successfully!",
            data: null,
        })
    );
}

export async function validatePasswordResetTokenHandler({
    token,
    response,
}: {
    token: string;
    response: FastifyReply;
}) {
    const oneTimeToken = await queryOneTimeToken(token);

    if (!oneTimeToken) {
        return response.status(404).send(
            apiResponse({
                status: 404,
                error: "Not Found",
                code: "token_not_found",
                message: "Token not found",
                data: null,
            })
        );
    }
    if (oneTimeToken.expiresAt < new Date()) {
        return response.status(410).send(
            apiResponse({
                status: 410,
                error: "Gone",
                code: "token_expired",
                message: "Token expired",
                data: null,
            })
        );
    }
    if (oneTimeToken.tokenType !== "password_reset") {
        return response.status(400).send(
            apiResponse({
                status: 400,
                error: "Bad Request",
                code: "invalid_token",
                message: "Invalid token",
                data: null,
            })
        );
    }

    return response.status(200).send(
        apiResponse({
            status: 200,
            error: null,
            code: "password_reset_token_valid",
            message: "The provided token is a valid one.",
            data: { valid: true },
        })
    );
}
