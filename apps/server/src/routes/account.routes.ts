import { confirmAccountDeletionSchema } from "@fixr/schemas/account";
import { Elysia, t } from "elysia";
import { getAccountHandler } from "../controllers/account/account-handler";
import {
	confirmAccountDeletionHandler,
	requestAccountDeletionHandler,
} from "../controllers/account/delete-handler";
import type { AuthenticatedContext } from "../helpers/elysia";
import { authenticate } from "../middlewares/authenticate";

export const accountRoutes = new Elysia({ prefix: "/account" })
	.use(authenticate)
	.get("/", (ctx) => {
		const { userJwt } = ctx as AuthenticatedContext;
		return getAccountHandler({ userId: userJwt.id });
	})
	.post("/request-deletion", async (ctx) => {
		const { userJwt, request, set } = ctx as AuthenticatedContext & {
			set: { status: number };
		};
		const baseUrl = new URL(request.url);
		const requestUrl = `${baseUrl.protocol}//${baseUrl.host}`;
		const result = await requestAccountDeletionHandler({
			userId: userJwt.id,
			requestUrl,
		});
		set.status = result.status;
		return result.response;
	})
	.get(
		"/confirm-deletion",
		async ({ query, cookie, set }) => {
			const validated = await confirmAccountDeletionSchema.parseAsync(query);
			const token = decodeURIComponent(validated.token);
			const result = await confirmAccountDeletionHandler({
				token,
				redirectUrl: validated.redirectUrl,
				cookie: cookie as unknown as Record<string, { value: string }>,
			});
			if ("redirect" in result) {
				set.status = result.status;
				set.redirect = result.redirect;
				return;
			}
			set.status = result.status;
			return result.response;
		},
		{
			query: t.Object({
				token: t.String(),
				redirectUrl: t.Optional(t.String()),
			}),
		}
	);
