import { apiResponse } from "@/src/helpers/response";
import { queryTokenData } from "@/src/services/auth.services";
import { deleteRefreshToken } from "@/src/services/tokens.services";

export async function signOutHandler({
	refreshToken,
}: {
	refreshToken: string | undefined;
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

	await deleteRefreshToken(tokenData.token);

	return {
		status: 200,
		response: apiResponse({
			status: 200,
			error: null,
			code: "signout_success",
			message: "User signed out successfully",
			data: null,
		}),
	} as const;
}
