import { apiResponse } from "@/src/helpers/response";
import { queryTokenData } from "@/src/services/auth.services";
import { deleteRefreshToken } from "@/src/services/tokens.services";
import { FastifyReply } from "fastify";

/**
 * This function "signs-out" the user by deleting his refreshToken from the db.
 * The frontend should then delete the cookies that it has stored and redirect to login.
 */
export async function signOutHandler({
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
     * If all checks succeed, delete the refreshToken, which will count as a signout.
     */
    await deleteRefreshToken(tokenData.token);

    return response.status(200).send(
        apiResponse({
            status: 200,
            error: null,
            code: "signout_success",
            message: "User signed out successfully",
            data: null,
        })
    );
}
