import { APP_NAME } from "@fixr/constants/app";
import { cookieKey } from "@fixr/constants/cookies";
import { env } from "@fixr/env/server";
import {
	emailDisplayName,
	sendAccountDeletionEmail,
} from "@fixr/mail/services";
import { apiResponse } from "@/src/helpers/response";
import { queryAccountById } from "../../services/account.services";
import { deleteUser } from "../../services/auth.services";
import {
	createOneTimeToken,
	deleteUserExpiredTokensByUserId,
	getUserOneTimeTokens,
	queryOneTimeToken,
} from "../../services/tokens.services";

export async function requestAccountDeletionHandler({
	userId,
	requestUrl,
}: {
	userId: string;
	requestUrl: string;
}) {
	await deleteUserExpiredTokensByUserId(userId);
	const oneTimeTokens = await getUserOneTimeTokens(userId);

	if (oneTimeTokens.some((token) => token.tokenType === "account_deletion")) {
		return {
			status: 409,
			response: apiResponse({
				status: 409,
				error: "Conflict",
				code: "existing_deletion_request",
				message:
					"Deletion request already exists. Finish it or wait until expiration to request a new one.",
				data: null,
			}),
		} as const;
	}

	const account = await queryAccountById(userId);

	const oneTimeToken = await createOneTimeToken({
		userId,
		email: account.email,
		tokenType: "account_deletion",
	});

	const redirectUrl = `${env.FRONTEND_URL}/auth/login`;
	const verificationUrl = `${requestUrl}/account/confirm-deletion?token=${encodeURIComponent(oneTimeToken.token)}&redirectUrl=${encodeURIComponent(redirectUrl)}`;

	await sendAccountDeletionEmail({
		to: account.email,
		appName: APP_NAME,
		verificationUrl,
		displayName: account.displayName ?? emailDisplayName(account.email),
	});

	return {
		status: 201,
		response: apiResponse({
			status: 201,
			error: null,
			code: "deletion_request_accepted",
			message: "Deletion request accepted, confirm email.",
			data: null,
		}),
	} as const;
}

export async function confirmAccountDeletionHandler({
	token,
	redirectUrl,
	cookie,
}: {
	token: string;
	redirectUrl?: string;
	cookie: Record<string, { value: string }>;
}): Promise<
	| { status: number; redirect: string }
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

	if (oneTimeToken.tokenType !== "account_deletion") {
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

	await deleteUser(oneTimeToken.user.id);

	if (redirectUrl) {
		(cookie as unknown as Record<string, unknown>)[
			cookieKey("showDeletedDialog")
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
			code: "account_deletion_success",
			message: "Account deleted successfully",
			data: null,
		}),
	};
}
