import type { Context } from "elysia";
import { AccountService } from "../services";

export class AccountController {
	static getAccount({ userId, ctx }: { userId: string; ctx: Context }) {
		return AccountService.getAccount({ userId, ctx });
	}

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
