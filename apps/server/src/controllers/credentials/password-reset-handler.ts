import { APP_NAME } from "@fixr/constants/app";
import { env } from "@fixr/env/server";
import { createEmailQueue, queueEmail } from "@fixr/mail/queue";
import { emailDisplayName } from "@fixr/mail/services";
import type { confirmPasswordResetSchema } from "@fixr/schemas/credentials";
import type { z } from "zod";
import { redis } from "@/src/config/redis";
import { hashPassword } from "@/src/helpers/hash-password";
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

export async function requestPasswordResetHandler({
	email,
}: {
	email: string;
}) {
	await deleteUserExpiredTokensByEmail(email);
	const oneTimeTokensList = await getUserOneTimeTokensWithEmail(email);

	if (oneTimeTokensList.some((token) => token.tokenType === "password_reset")) {
		return {
			status: 409,
			response: apiResponse({
				status: 409,
				error: "Conflict",
				code: "existing_password_reset_request",
				message:
					"Password reset request already exists. Finish it or wait until expiration (30 minutes from request) to issue a new one.",
				data: null,
			}),
		} as const;
	}

	const user = await queryUserByEmail(email);

	if (!user) {
		return {
			status: 404,
			response: apiResponse({
				status: 404,
				error: "Not Found",
				code: "user_not_found",
				message: "User not found",
				data: null,
			}),
		} as const;
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
			verificationUrl,
			displayName: user.displayName ?? emailDisplayName(user.email),
		},
	});

	return {
		status: 201,
		response: apiResponse({
			status: 201,
			error: null,
			code: "password_reset_request_accepted",
			message: "Reset request accepted, confirm email.",
			data: null,
		}),
	} as const;
}

export async function confirmPasswordResetHandler({
	body,
}: {
	body: z.infer<typeof confirmPasswordResetSchema>;
}) {
	const oneTimeToken = await queryOneTimeToken(body.token);

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
		} as const;
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
		} as const;
	}
	if (oneTimeToken.tokenType !== "password_reset") {
		return {
			status: 400,
			response: apiResponse({
				status: 400,
				error: "Bad Request",
				code: "invalid_token",
				message: "Invalid token",
				data: null,
			}),
		} as const;
	}

	const hashedPassword = await hashPassword(body.password);
	await updateUserPassword(oneTimeToken.user.id, hashedPassword);
	await deleteOneTimeToken(oneTimeToken.token);

	return {
		status: 200,
		response: apiResponse({
			status: 200,
			error: null,
			code: "password_update_success",
			message: "Password updated successfully!",
			data: null,
		}),
	} as const;
}

export async function validatePasswordResetTokenHandler({
	token,
}: {
	token: string;
}) {
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
		} as const;
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
		} as const;
	}
	if (oneTimeToken.tokenType !== "password_reset") {
		return {
			status: 400,
			response: apiResponse({
				status: 400,
				error: "Bad Request",
				code: "invalid_token",
				message: "Invalid token",
				data: null,
			}),
		} as const;
	}

	return {
		status: 200,
		response: apiResponse({
			status: 200,
			error: null,
			code: "password_reset_token_valid",
			message: "The provided token is a valid one.",
			data: { valid: true },
		}),
	} as const;
}
