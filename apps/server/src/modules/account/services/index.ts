import { APP_NAME } from "@fixr/constants/app";
import { cookieKey } from "@fixr/constants/cookies";
import { env } from "@fixr/env/server";
import {
	emailDisplayName,
	sendAccountDeletionEmail,
} from "@fixr/mail/services";
import type { Context } from "elysia";
import { AppError } from "../../../core/lib/app-error";
import { apiResponse } from "../../../core/lib/response";
import { AuthRepository } from "../../auth/repositories";
import { TokensRepository } from "../../tokens/repositories";
import { TokensService } from "../../tokens/services";
import { AccountRepository } from "../repositories";

export class AccountService {
	static async getAccount({ userId, ctx }: { userId: string; ctx: Context }) {
		const account = await AccountRepository.queryAccountById(userId);

		ctx.set.status = 200;
		return apiResponse({
			status: 200,
			error: null,
			code: "get_account_success",
			message: "Account retrieved successfully.",
			data: account,
		});
	}

	static async requestAccountDeletion({
		userId,
		ctx,
	}: {
		userId: string;
		ctx: Context;
	}) {
		await TokensRepository.deleteUserExpiredTokensByUserId(userId);
		const oneTimeTokens = await TokensRepository.getUserOneTimeTokens(userId);

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

		const reqUrl = new URL(ctx.request.url);
		const verificationUrl = `${reqUrl.protocol}//${reqUrl.host}/account/confirm-deletion?token=${encodeURIComponent(oneTimeToken.token)}&redirectUrl=${encodeURIComponent(redirectUrl)}`;

		await sendAccountDeletionEmail({
			to: account.email,
			appName: APP_NAME,
			verificationUrl,
			displayName: account.displayName ?? emailDisplayName(account.email),
		});

		ctx.set.status = 201;
		return apiResponse({
			status: 201,
			error: null,
			code: "deletion_request_accepted",
			message: "Deletion request accepted, confirm email.",
			data: null,
		});
	}

	static async confirmAccountDeletion({
		token,
		redirectUrl,
		ctx,
	}: {
		token: string;
		redirectUrl?: string;
		ctx: Context;
	}) {
		const oneTimeToken = await TokensRepository.queryOneTimeToken(token);

		if (!oneTimeToken) {
			throw new AppError("ACCOUNT_TOKEN_NOT_FOUND");
		}

		if (oneTimeToken.expiresAt < new Date()) {
			throw new AppError("ACCOUNT_TOKEN_EXPIRED");
		}

		if (oneTimeToken.tokenType !== "account_deletion") {
			throw new AppError("ACCOUNT_INVALID_TOKEN");
		}

		await AuthRepository.deleteUser(oneTimeToken.user.id);

		if (redirectUrl) {
			ctx.cookie[cookieKey("showDeletedDialog")]?.set({
				value: "true",
				path: "/",
				httpOnly: false,
				sameSite: "none",
				secure: true,
			});
			ctx.set.status = 302;
			ctx.set.redirect = decodeURIComponent(redirectUrl);
			return;
		}

		ctx.set.status = 200;
		return apiResponse({
			status: 200,
			error: null,
			code: "account_deletion_success",
			message: "Account deleted sucessfully",
			data: null,
		});
	}
}
