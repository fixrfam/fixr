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
import { env } from "@/src/env";
import { cookieKey } from "@fixr/constants/cookies";
import { CookieSerializeOptions } from "@fastify/cookie";

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

        const authLoginUrl = `${env.FRONTEND_URL}/auth/login`;
        const errorCookieSettings: CookieSerializeOptions = {
            path: "/",
            httpOnly: false,
            sameSite: "none",
            secure: true,
        };

        if (!payload?.email) {
            return response
                .setCookie(cookieKey("googleAuthError"), "gacc_missing_email", errorCookieSettings)
                .status(302)
                .redirect(authLoginUrl);
        }

        const user = await queryUserByEmail(payload.email.toLowerCase());

        if (!user) {
            return response
                .setCookie(cookieKey("googleAuthError"), "gacc_user_not_found", errorCookieSettings)
                .status(302)
                .redirect(authLoginUrl);
        }

        if (!user.verified || !payload.email_verified) {
            return response
                .setCookie(
                    cookieKey("googleAuthError"),
                    "gacc_email_not_verified",
                    errorCookieSettings
                )
                .status(302)
                .redirect(authLoginUrl);
        }

        await updateUserWithGoogleData({ userId: user.id, data: payload });
        const payloadJWT = await queryJWTPayloadByUserId(user.id);

        const token = signJWT({ payload: payloadJWT });

        const refreshToken = generateRefreshToken();
        await setRefreshToken(response, refreshToken, user.id);
        setJWTCookie(response, token);

        const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;

        return response.redirect(dashboardUrl);
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
