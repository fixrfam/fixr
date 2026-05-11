import { APP_NAME } from "@fixr/constants/app";
import { cookieKey } from "@fixr/constants/cookies";
import { env } from "@fixr/env/server";
import {
	emailDisplayName,
	sendAccountDeletionEmail,
} from "@fixr/mail/services";
import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../../../core/lib/app-error";
import { apiResponse } from "../../../core/lib/response";
import { AuthRepository } from "../../auth/repositories";
import { TokensRepository } from "../../tokens/repositories";
import { TokensService } from "../../tokens/services";
import { AccountRepository } from "../repositories";

/** @description Account business logic */
export class AccountService {
	/**
	 * Get account details for the authenticated user
	 *
	 * @param userId - The authenticated user ID
	 * @param response - Fastify reply
	 */
	static async getAccount({
		userId,
		response,
	}: {
		userId: string;
		response: FastifyReply;
	}) {
		const account = await AccountRepository.queryAccountById(userId);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "get_account_success",
				message: "Account retrieved successfully.",
				data: account,
			})
		);
	}

	/**
	 * Request account deletion.
	 * Creates a one-time deletion token and sends a confirmation email.
	 *
	 * @param userId - The authenticated user ID
	 * @param request - Fastify request (used to build confirmation URL)
	 * @param response - Fastify reply
	 */
	static async requestAccountDeletion({
		userId,
		request,
		response,
	}: {
		userId: string;
		request: FastifyRequest;
		response: FastifyReply;
	}) {
		await TokensRepository.deleteUserExpiredTokensByUserId(userId);
		const oneTimeTokens = await TokensRepository.getUserOneTimeTokens(userId);

		// Use Array.some() for better performance when checking existence
		if (oneTimeTokens.some((token) => token.tokenType === "account_deletion")) {
			throw new AppError("ACCOUNT_EXISTING_DELETION_REQUEST");
		}

		const account = await AccountRepository.queryAccountById(userId);

		const oneTimeToken = await TokensService.createOneTimeToken({
			userId,
			email: account.email,
			tokenType: "account_deletion",
		});

		const redirectUrl = `${env.FRONTEND_URL}/auth/login`;

		const verificationUrl = `${request.protocol}://${request.host}/account/confirm-deletion?token=${encodeURIComponent(oneTimeToken.token)}&redirectUrl=${encodeURIComponent(redirectUrl)}`;

		await sendAccountDeletionEmail({
			to: account.email,
			appName: APP_NAME,
			verificationUrl,
			displayName: account.displayName ?? emailDisplayName(account.email),
		});

		return response.status(201).send(
			apiResponse({
				status: 201,
				error: null,
				code: "deletion_request_accepted",
				message: "Deletion request accepted, confirm email.",
				data: null,
			})
		);
	}

	/**
	 * Confirm account deletion using a one-time deletion token.
	 *
	 * @param token - The deletion confirmation token
	 * @param redirectUrl - Optional redirect URL after deletion
	 * @param response - Fastify reply
	 */
	static async confirmAccountDeletion({
		token,
		redirectUrl,
		response,
	}: {
		token: string;
		redirectUrl?: string;
		response: FastifyReply;
	}) {
		const oneTimeToken = await TokensRepository.queryOneTimeToken(token);

		//Checks if the token exists, if it's not expired and if it's a deletion token
		if (!oneTimeToken) {
			throw new AppError("ACCOUNT_TOKEN_NOT_FOUND");
		}

		if (oneTimeToken.expiresAt < new Date()) {
			throw new AppError("ACCOUNT_TOKEN_EXPIRED");
		}

		if (oneTimeToken.tokenType !== "account_deletion") {
			throw new AppError("ACCOUNT_INVALID_TOKEN");
		}

		//If all checks succeed, delete the user and the token will be automatically cascade deleted
		await AuthRepository.deleteUser(oneTimeToken.user.id);

		if (redirectUrl) {
			return response
				.setCookie(cookieKey("showDeletedDialog"), "true", {
					path: "/",
					httpOnly: false,
					sameSite: "none",
					secure: true,
				})
				.status(302)
				.redirect(decodeURIComponent(redirectUrl));
		}

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "account_deletion_success",
				message: "Account deleted sucessfully",
				data: null,
			})
		);
	}
}
