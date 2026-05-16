import { permissions } from "@fixr/permissions";
import { confirmAccountDeletionSchema } from "@fixr/schemas/account";
import type { userJWT } from "@fixr/schemas/auth";
import type { Context, Elysia } from "elysia";
import type { z } from "zod";
import { accountDocs } from "../../../core/docs/account.docs";
import { authenticate } from "../../../core/middlewares/authenticate";
import { requirePermission } from "../../../core/middlewares/rbac";
import { AccountController } from "../controllers";

export function accountRoutes(app: Elysia) {
	return app
		.get(
			"/account",
			(ctx: Context) => {
				const user = (ctx as Context & { user: z.infer<typeof userJWT> }).user;
				return AccountController.getAccount({ userId: user.id, ctx });
			},
			{
				...accountDocs.getAccountSchema,
				beforeHandle: [
					authenticate,
					requirePermission(permissions.account.read),
				],
			}
		)
		.post(
			"/account/request-deletion",
			(ctx: Context) => {
				const user = (ctx as Context & { user: z.infer<typeof userJWT> }).user;
				return AccountController.requestAccountDeletion({
					userId: user.id,
					ctx,
				});
			},
			{
				...accountDocs.requestDeletionSchema,
				beforeHandle: [
					authenticate,
					requirePermission(permissions.account.delete),
				],
			}
		)
		.get(
			"/account/confirm-deletion",
			async (ctx: Context) => {
				const query = await confirmAccountDeletionSchema.parseAsync(ctx.query);
				const token = decodeURIComponent(query.token);
				return AccountController.confirmAccountDeletion({
					token,
					redirectUrl: query.redirectUrl,
					ctx,
				});
			},
			accountDocs.confirmDeletionSchema
		);
}
