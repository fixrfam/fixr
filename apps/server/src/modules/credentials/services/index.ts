import { APP_NAME } from "@fixr/constants/app";
import { env } from "@fixr/env/server";
import { createEmailQueue, queueEmail } from "@fixr/mail/queue";
import { emailDisplayName } from "@fixr/mail/services";
import type { userJWT } from "@fixr/schemas/auth";
import type { confirmPasswordResetSchema } from "@fixr/schemas/credentials";
import bcrypt from "bcryptjs";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { redis } from "../../../config/redis";
import { AppError } from "../../../core/lib/app-error";
import { hashPassword } from "../../../core/lib/hash-password";
import { apiResponse } from "../../../core/lib/response";
import { AuthRepository } from "../../auth/repositories";
import { TokensRepository } from "../../tokens/repositories";
import { TokensService } from "../../tokens/services";
import { CredentialsRepository } from "../repositories";

/** @description Credentials business logic */
export class CredentialsService {
	/**
	 * Change password for an authenticated user
	 *
	 * @param user - The authenticated user JWT
	 * @param body - Change password request body
	 * @param response - Fastify reply
	 */
	static async changePasswordAuthenticated({
		user,
		body,
		response,
	}: {
		user: z.infer<typeof userJWT>;
		body: { old: string; new: string };
		response: FastifyReply;
	}) {
		const userData = await AuthRepository.queryUserById(user.id);

		const validPassword = await bcrypt.compare(body.old, userData.passwordHash);

		if (!validPassword) {
			throw new AppError("CREDENTIALS_INVALID_PASSWORD");
		}

		if (body.old === body.new) {
			throw new AppError("CREDENTIALS_EQUAL_PASSWORDS");
		}

		const hashedPassword = await hashPassword(body.new);

		await CredentialsRepository.updateUserPassword(user.id, hashedPassword);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "password_update_success",
				message: "Password updated successfully!",
				data: null,
			})
		);
	}

	/**
	 * Request a password reset for an account.
	 * Creates a one-time password reset token and sends an email.
	 *
	 * @param email - The account email
	 * @param response - Fastify reply
	 */
	static async requestPasswordReset({
		email,
		response,
	}: {
		email: string;
		response: FastifyReply;
	}) {
		await TokensRepository.deleteUserExpiredTokensByEmail(email);
		const oneTimeTokens =
			await TokensRepository.getUserOneTimeTokensWithEmail(email);

		// Use Array.some() for better performance when checking existence
		if (oneTimeTokens.some((token) => token.tokenType === "password_reset")) {
			throw new AppError("CREDENTIALS_EXISTING_RESET_REQUEST");
		}

		const user = await AuthRepository.queryUserByEmail(email);

		if (!user) {
			throw new AppError("CREDENTIALS_USER_NOT_FOUND");
		}

		const oneTimeToken = await TokensService.createOneTimeToken({
			userId: user.id,
			email,
			tokenType: "password_reset",
		});

		const emailQueue = createEmailQueue(redis);

		const verificationUrl = `${env.FRONTEND_URL}/auth/forgot-password/${encodeURIComponent(oneTimeToken.token)}`;

		await queueEmail(emailQueue, {
			job: "sendPasswordResetEmail",
			payload: {
				to: user.email,
				appName: APP_NAME,
				verificationUrl,
				displayName: user.displayName ?? emailDisplayName(user.email),
			},
		});

		return response.status(201).send(
			apiResponse({
				status: 201,
				error: null,
				code: "password_reset_request_accepted",
				message: "Reset request accepted, confirm email.",
				data: null,
			})
		);
	}

	/**
	 * Confirm password reset with a one-time password reset token and new password.
	 *
	 * @param body - Password reset confirmation body
	 * @param response - Fastify reply
	 */
	static async confirmPasswordReset({
		body,
		response,
	}: {
		body: z.infer<typeof confirmPasswordResetSchema>;
		response: FastifyReply;
	}) {
		const oneTimeToken = await TokensRepository.queryOneTimeToken(body.token);

		//Checks if the token exists, if it's not expired and if it's a password reset token
		if (!oneTimeToken) {
			throw new AppError("CREDENTIALS_TOKEN_NOT_FOUND");
		}

		if (oneTimeToken.expiresAt < new Date()) {
			throw new AppError("CREDENTIALS_TOKEN_EXPIRED");
		}

		if (oneTimeToken.tokenType !== "password_reset") {
			throw new AppError("CREDENTIALS_INVALID_TOKEN");
		}

		//If all checks succeed, update the user password and delete the token
		const hashedPassword = await hashPassword(body.password);

		const updatePass = CredentialsRepository.updateUserPassword(
			oneTimeToken.user.id,
			hashedPassword
		);
		const deleteToken = TokensRepository.deleteOneTimeToken(oneTimeToken.token);

		await Promise.all([updatePass, deleteToken]);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "password_update_success",
				message: "Password updated successfully!",
				data: null,
			})
		);
	}

	/**
	 * Validate a password reset token.
	 *
	 * @param token - The password reset token
	 * @param response - Fastify reply
	 */
	static async validatePasswordResetToken({
		token,
		response,
	}: {
		token: string;
		response: FastifyReply;
	}) {
		const oneTimeToken = await TokensRepository.queryOneTimeToken(token);

		if (!oneTimeToken) {
			throw new AppError("CREDENTIALS_TOKEN_NOT_FOUND");
		}

		if (oneTimeToken.expiresAt < new Date()) {
			throw new AppError("CREDENTIALS_TOKEN_EXPIRED");
		}

		if (oneTimeToken.tokenType !== "password_reset") {
			throw new AppError("CREDENTIALS_INVALID_TOKEN");
		}

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "password_reset_token_valid",
				message: "The provided token is a valid one.",
				data: {
					valid: true,
				},
			})
		);
	}
}
