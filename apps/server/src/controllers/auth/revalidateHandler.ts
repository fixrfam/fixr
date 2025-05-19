import { FastifyReply } from "fastify";

import { apiResponse } from "@/src/helpers/response";

import { signJWT } from "../../helpers/jwt";
import { generateRefreshToken } from "../../helpers/tokens";
import { queryJWTPayloadByUserId, queryTokenData } from "../../services/auth.services";
import { deleteRefreshToken, setJWTCookie, setRefreshToken } from "../../services/tokens.services";
import { jwtPayload } from "@fixr/schemas/auth";

/*
This function is used to revalidate the JWT token

When the JWT expires, the front-end needs to reach this endpoint with the refresh token to get a new JWT
This process makes sure that the JWT was not stolen, as the refresh token is stored in a secure-only cookie,
that can only be obtained when logging in with email and password
*/
export async function revalidateHandler({
    refreshToken,
    response,
}: {
    refreshToken: string | undefined;
    response: FastifyReply;
}) {
    if (!refreshToken) {
        return response.status(400).send(
            apiResponse({
                status: 400,
                error: "Bad Request",
                code: "no_refresh_provided",
                message: "No refresh token provided",
                data: null,
            })
        );
    }

    const tokenData = await queryTokenData(refreshToken);

    if (!tokenData) {
        return response.status(401).send(
            apiResponse({
                status: 401,
                error: "Unauthorized",
                code: "invalid_refresh",
                message: "Invalid refresh token",
                data: null,
            })
        );
    }

    if (tokenData.expiresAt < new Date()) {
        return response.status(410).send(
            apiResponse({
                status: 410,
                error: "Gone",
                code: "refresh_expired",
                message: "Refresh token expired",
                data: null,
            })
        );
    }

    const user = tokenData.user;

    if (!user) {
        return response.status(404).send(
            apiResponse({
                status: 404,
                error: "Not found",
                code: "user_not_found",
                message: "User not found",
                data: null,
            })
        );
    }

    /**
     * If all checks succeed, delete the used refreshToken, issue a new JWT with the new payload and issue a new refreshToken
     */
    const deleteRefresh = deleteRefreshToken(tokenData.token);
    const queryPayload = queryJWTPayloadByUserId(user.id);

    const [payload] = await Promise.all([queryPayload, deleteRefresh]);

    const jwt = signJWT({
        payload: jwtPayload.parse(payload),
    });

    const newRefreshToken = generateRefreshToken();
    await setRefreshToken(response, newRefreshToken, user.id);
    setJWTCookie(response, jwt);

    return response.status(200).send(
        apiResponse({
            status: 200,
            error: null,
            code: "revalidate_success",
            message: "JWT revalidated successfully",
            data: {
                token: jwt,
            },
        })
    );
}
