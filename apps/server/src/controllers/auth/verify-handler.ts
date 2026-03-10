import { cookieKey } from "@fixr/constants/cookies";
import { apiResponse } from "@/src/helpers/response";
import { setUserVerified } from "../../services/auth.services";
import {
	deleteOneTimeToken,
	queryOneTimeToken,
} from "../../services/tokens.services";

export async function verifyHandler({
	token,
	redirectUrl,
	cookie,
}: {
	token: string;
	redirectUrl?: string;
	cookie: Record<string, { value: string }>;
}): Promise<
	| { status: number; redirect: string; cookie?: Record<string, unknown> }
	| { status: number; response: ReturnType<typeof apiResponse> }
> {
	const oneTimeToken = await queryOneTimeToken(token);

	if (!oneTimeToken) {
		return {
			status: 404,
			response: apiResponse({
				status: 404,
				error: "Not Found",
				code: "token_not_found",
				message: "Token not found",
				data: null,
			}),
		};
	}
	if (oneTimeToken.expiresAt < new Date()) {
		return {
			status: 410,
			response: apiResponse({
				status: 410,
				error: "Gone",
				code: "token_expired",
				message: "Token expired",
				data: null,
			}),
		};
	}
	if (oneTimeToken.tokenType !== "confirmation") {
		return {
			status: 400,
			response: apiResponse({
				status: 400,
				error: "Bad Request",
				code: "invalid_token",
				message: "Invalid token",
				data: null,
			}),
		};
	}

	const verifyUser = setUserVerified(oneTimeToken.user.id);
	const deleteToken = deleteOneTimeToken(oneTimeToken.token);
	await Promise.all([verifyUser, deleteToken]);

	if (redirectUrl) {
		(cookie as unknown as Record<string, unknown>)[
			cookieKey("showVerifiedDialog")
		] = {
			value: "true",
			path: "/",
			httpOnly: false,
			sameSite: "none",
			secure: true,
		};
		return { status: 302, redirect: decodeURIComponent(redirectUrl) };
	}

	return {
		status: 200,
		response: apiResponse({
			status: 200,
			error: null,
			code: "email_verify_success",
			message: "Email verified successfully",
			data: null,
		}),
	};
}
