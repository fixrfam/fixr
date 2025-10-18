import { FastifyReply, FastifyRequest } from "fastify";
import { OAuth2Client } from "google-auth-library";
import { apiResponse } from "@/src/helpers/response";
import { queryUserByEmail, queryJWTPayloadByUserId } from "@/src/services/auth.services";
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
    console.log(url);

    return response.redirect(url);
}
