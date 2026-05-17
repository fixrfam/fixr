import type { Context } from "elysia";
import { AccountService } from "../services";

/** @description Account request handlers */
export class AccountController {
	/** @description Get the authenticated user's account */
	static getAccount({ userId, ctx }: { userId: string; ctx: Context }) {
		return AccountService.getAccount({ userId, ctx });
	}

	/** @description Request account deletion */
	static requestAccountDeletion({
		userId,
		ctx,
	}: {
		userId: string;
		ctx: Context;
	}) {
		return AccountService.requestAccountDeletion({
			userId,
			ctx,
		});
	}

	/** @description Confirm account deletion with token */
	static confirmAccountDeletion({
		token,
		redirectUrl,
		ctx,
	}: {
		token: string;
		redirectUrl?: string;
		ctx: Context;
	}) {
		return AccountService.confirmAccountDeletion({
			token,
			redirectUrl,
			ctx,
		});
	}
}
