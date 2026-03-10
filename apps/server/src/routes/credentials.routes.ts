import {
	changePasswordAuthenticatedSchema,
	confirmPasswordResetSchema,
	requestPasswordResetSchema,
} from "@fixr/schemas/credentials";
import { Elysia, t } from "elysia";
import { z } from "zod";
import { changePasswordAuthenticatedHandler } from "../controllers/credentials/change-password-authenticated-handler";
import {
	confirmPasswordResetHandler,
	requestPasswordResetHandler,
	validatePasswordResetTokenHandler,
} from "../controllers/credentials/password-reset-handler";
import type { AuthenticatedContext } from "../helpers/elysia";
import { authenticate } from "../middlewares/authenticate";

export const credentialsRoutes = new Elysia({ prefix: "/credentials" })
	.use(authenticate)
	.put(
		"/password",
		async (ctx) => {
			const { userJwt, body, set } = ctx as unknown as AuthenticatedContext & {
				body: { old: string; new: string };
				set: { status: number };
			};
			const validBody = changePasswordAuthenticatedSchema.parse(body);
			const result = await changePasswordAuthenticatedHandler({
				user: userJwt,
				body: validBody,
			});
			set.status = result.status;
			return result.response;
		},
		{
			body: t.Object({
				old: t.String({ minLength: 1 }),
				new: t.String({ minLength: 8 }),
			}),
		}
	)
	.post(
		"/password/reset",
		async ({ body, set }) => {
			const validBody = requestPasswordResetSchema.parse(body);
			const result = await requestPasswordResetHandler({
				email: validBody.email,
			});
			set.status = result.status;
			return result.response;
		},
		{
			body: t.Object({
				email: t.String({ format: "email" }),
			}),
		}
	)
	.put(
		"/password/reset",
		async ({ body, set }) => {
			const validBody = confirmPasswordResetSchema.parse(body);
			const result = await confirmPasswordResetHandler({ body: validBody });
			set.status = result.status;
			return result.response;
		},
		{
			body: t.Object({
				token: t.String(),
				password: t.String({ minLength: 8 }),
			}),
		}
	)
	.get(
		"/password/reset",
		async ({ query, set }) => {
			const validated = await z.object({ token: z.string() }).parseAsync(query);
			const token = decodeURIComponent(validated.token);
			const result = await validatePasswordResetTokenHandler({ token });
			set.status = result.status;
			return result.response;
		},
		{
			query: t.Object({
				token: t.String(),
			}),
		}
	);
