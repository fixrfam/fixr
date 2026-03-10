import { jwtPayload } from "@fixr/schemas/auth";
import { apiResponse } from "@/src/helpers/response";
import { signJWT } from "../../helpers/jwt";
import { generateRefreshToken } from "../../helpers/tokens";
import {
	queryJWTPayloadByUserId,
	queryTokenData,
} from "../../services/auth.services";
import {
	deleteRefreshToken,
	setJWTCookie,
	setRefreshToken,
} from "../../services/tokens.services";

export async function revalidateHandler({
	refreshToken,
	cookie,
}: {
	refreshToken: string | undefined;
	cookie: Record<string, { value: string }>;
}) {
	if (!refreshToken) {
		return {
			status: 400,
			response: apiResponse({
				status: 400,
				error: "Bad Request",
				code: "no_refresh_provided",
				message: "No refresh token provided",
				data: null,
			}),
		} as const;
	}

	const tokenData = await queryTokenData(refreshToken);

	if (!tokenData) {
		return {
			status: 401,
			response: apiResponse({
				status: 401,
				error: "Unauthorized",
				code: "invalid_refresh",
				message: "Invalid refresh token",
				data: null,
			}),
		} as const;
	}

	if (tokenData.expiresAt < new Date()) {
		return {
			status: 410,
			response: apiResponse({
				status: 410,
				error: "Gone",
				code: "refresh_expired",
				message: "Refresh token expired",
				data: null,
			}),
		} as const;
	}

	const user = tokenData.user;

	if (!user) {
		return {
			status: 404,
			response: apiResponse({
				status: 404,
				error: "Not found",
				code: "user_not_found",
				message: "User not found",
				data: null,
			}),
		} as const;
	}

	const deleteRefresh = deleteRefreshToken(tokenData.token);
	const queryPayload = queryJWTPayloadByUserId(user.id);

	const [payload] = await Promise.all([queryPayload, deleteRefresh]);

	const jwt = await signJWT({ payload: jwtPayload.parse(payload) });
	const newRefreshToken = generateRefreshToken();

	await setRefreshToken(cookie, newRefreshToken, user.id);
	setJWTCookie(cookie, jwt);

	return {
		status: 200,
		response: apiResponse({
			status: 200,
			error: null,
			code: "revalidate_success",
			message: "JWT revalidated successfully",
			data: { token: jwt },
		}),
	} as const;
}
