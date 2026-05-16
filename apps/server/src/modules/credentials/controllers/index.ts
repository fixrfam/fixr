import type { userJWT } from "@fixr/schemas/auth";
import type {
	changePasswordAuthenticatedSchema,
	confirmPasswordResetSchema,
} from "@fixr/schemas/credentials";
import type { Context } from "elysia";
import type { z } from "zod";
import { CredentialsService } from "../services";

export class CredentialsController {
	static changePasswordAuthenticated({
		user,
		body,
		ctx,
	}: {
		user: z.infer<typeof userJWT>;
		body: z.infer<typeof changePasswordAuthenticatedSchema>;
		ctx: Context;
	}) {
		return CredentialsService.changePasswordAuthenticated({
			user,
			body,
			ctx,
		});
	}

	static requestPasswordReset({ email, ctx }: { email: string; ctx: Context }) {
		return CredentialsService.requestPasswordReset({
			email,
			ctx,
		});
	}

	static confirmPasswordReset({
		body,
		ctx,
	}: {
		body: z.infer<typeof confirmPasswordResetSchema>;
		ctx: Context;
	}) {
		return CredentialsService.confirmPasswordReset({ body, ctx });
	}

	static validatePasswordResetToken({
		token,
		ctx,
	}: {
		token: string;
		ctx: Context;
	}) {
		return CredentialsService.validatePasswordResetToken({ token, ctx });
	}
}
