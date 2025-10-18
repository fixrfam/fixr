import { FastifyReply, FastifyRequest } from "fastify";
import { OAuth2Client } from "google-auth-library";
import { apiResponse } from "@/src/helpers/response";
import {
    queryUserByEmail,
    queryJWTPayloadByUserId,
    updateUserWithGoogleData,
} from "@/src/services/auth.services";
import { signJWT } from "@/src/helpers/jwt";
import { generateRefreshToken } from "@/src/helpers/tokens";
import { setJWTCookie, setRefreshToken } from "@/src/services/tokens.services";
import { jwtPayload } from "@fixr/schemas/auth";
import { env } from "@/src/env";

const GOOGLE_CREDS = {
    clientId: env.GOOGLE_AUTH_CLIENT_ID,
    clientSecret: env.GOOGLE_AUTH_CLIENT_SECRET,
    redirectUri: env.GOOGLE_AUTH_REDIRECT_URI,
};

const client = new OAuth2Client(GOOGLE_CREDS);

export async function googleLoginHandler({
    response,
}: {
    request: FastifyRequest;
    response: FastifyReply;
}) {
    const params = {
        client_id: GOOGLE_CREDS.clientId,
        redirect_uri: GOOGLE_CREDS.redirectUri,
        response_type: "code",
        scope: "openid email profile",
    };

    const query = new URLSearchParams(params).toString();
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${query}`;

    return response.redirect(url);
}

export async function googleCallbackHandler({
    code,
    response,
}: {
    code: string;
    response: FastifyReply;
}) {
    if (!code) {
        return response.status(422).send(
            apiResponse({
                status: 422,
                error: "Unprocessable Entity",
                code: "missing_code",
                message: "Missing authorization code from Google",
                data: null,
            })
        );
    }

    try {
        const { tokens } = await client.getToken(code);
        const idToken = tokens.id_token;

        if (!idToken) {
            return response.status(502).send(
                apiResponse({
                    status: 502,
                    error: "Bad Gateway",
                    code: "missing_id_token",
                    message: "No ID token returned from Google",
                    data: null,
                })
            );
        }

        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID!,
        });

        const payload = ticket.getPayload();

        if (!payload?.email) {
            return response.status(424).send(
                apiResponse({
                    status: 424,
                    error: "Failed Dependency",
                    code: "missing_email",
                    message: "Google account did not return an email",
                    data: null,
                })
            );
        }

        const user = await queryUserByEmail(payload.email.toLowerCase());

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

        if (!user.verified) {
            return response.status(403).send(
                apiResponse({
                    status: 403,
                    error: "Forbidden",
                    code: "email_not_verified",
                    message: "Email not verified",
                    data: null,
                })
            );
        }

        await updateUserWithGoogleData({ userId: user.id, data: payload });
        const payloadJWT = await queryJWTPayloadByUserId(user.id);

        const token = signJWT({ payload: payloadJWT });

        const refreshToken = generateRefreshToken();
        await setRefreshToken(response, refreshToken, user.id);
        setJWTCookie(response, token);

        return response.redirect(`${env.FRONTEND_URL}/dashboard`);
    } catch (err) {
        console.error(err);
        return response.status(500).send(
            apiResponse({
                status: 500,
                error: "Internal Server Error",
                code: "google_auth_failed",
                message: "Failed to authenticate with Google",
                data: null,
            })
        );
    }
}
