import { APP_NAME } from "@fixr/constants/app";
import { env } from "@fixr/env/server";
import { createEmailQueue, queueEmail } from "@fixr/mail/queue";
import { emailDisplayName } from "@fixr/mail/services";
import type { userJWT } from "@fixr/schemas/auth";
import type { confirmPasswordResetSchema } from "@fixr/schemas/credentials";
import bcrypt from "bcrypt";
import type { Context } from "elysia";
import type { z } from "zod";
import { redis } from "../../../config/redis";
import { AppError } from "../../../core/lib/app-error";
import { hashPassword } from "../../../core/lib/hash-password";
import { apiResponse } from "../../../core/lib/response";
import { AuthRepository } from "../../auth/repositories";
import { TokensRepository } from "../../tokens/repositories";
import { TokensService } from "../../tokens/services";
import { CredentialsRepository } from "../repositories";

export class CredentialsService {
	static async changePasswordAuthenticated({
		user,
		body,
		ctx,
	}: {
		user: z.infer<typeof userJWT>;
		body: { old: string; new: string };
		ctx: Context;
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

		ctx.set.status = 200;
		return apiResponse({
			status: 200,
			error: null,
			code: "password_update_success",
			message: "Password updated successfully!",
			data: null,
		});
	}

	static async requestPasswordReset({
		email,
		ctx,
	}: {
		email: string;
		ctx: Context;
	}) {
		await TokensRepository.deleteUserExpiredTokensByEmail(email);
		const oneTimeTokens =
			await TokensRepository.getUserOneTimeTokensWithEmail(email);

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

		ctx.set.status = 201;
		return apiResponse({
			status: 201,
			error: null,
			code: "password_reset_request_accepted",
			message: "Reset request accepted, confirm email.",
			data: null,
		});
	}

	static async confirmPasswordReset({
		body,
		ctx,
	}: {
		body: z.infer<typeof confirmPasswordResetSchema>;
		ctx: Context;
	}) {
		const oneTimeToken = await TokensRepository.queryOneTimeToken(body.token);

		if (!oneTimeToken) {
			throw new AppError("CREDENTIALS_TOKEN_NOT_FOUND");
		}

		if (oneTimeToken.expiresAt < new Date()) {
			throw new AppError("CREDENTIALS_TOKEN_EXPIRED");
		}

		if (oneTimeToken.tokenType !== "password_reset") {
			throw new AppError("CREDENTIALS_INVALID_TOKEN");
		}

		const hashedPassword = await hashPassword(body.password);

		const updatePass = CredentialsRepository.updateUserPassword(
			oneTimeToken.user.id,
			hashedPassword
		);
		const deleteToken = TokensRepository.deleteOneTimeToken(oneTimeToken.token);

		await Promise.all([updatePass, deleteToken]);

		ctx.set.status = 200;
		return apiResponse({
			status: 200,
			error: null,
			code: "password_update_success",
			message: "Password updated successfully!",
			data: null,
		});
	}

	static async validatePasswordResetToken({
		token,
		ctx,
	}: {
		token: string;
		ctx: Context;
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

		ctx.set.status = 200;
		return apiResponse({
			status: 200,
			error: null,
			code: "password_reset_token_valid",
			message: "The provided token is a valid one.",
			data: {
				valid: true,
			},
		});
	}
}
