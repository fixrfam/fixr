import type { userJWT } from "@fixr/schemas/auth";
import type {
	changePasswordAuthenticatedSchema,
	confirmPasswordResetSchema,
} from "@fixr/schemas/credentials";
import type { Context } from "elysia";
import type { z } from "zod";
import { CredentialsService } from "../services";

/** @description Credentials request handlers */
export class CredentialsController {
	/** @description Change password for authenticated user */
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

	/** @description Request a password reset email */
	static requestPasswordReset({ email, ctx }: { email: string; ctx: Context }) {
		return CredentialsService.requestPasswordReset({
			email,
			ctx,
		});
	}

	/** @description Confirm password reset with token */
	static confirmPasswordReset({
		body,
		ctx,
	}: {
		body: z.infer<typeof confirmPasswordResetSchema>;
		ctx: Context;
	}) {
		return CredentialsService.confirmPasswordReset({ body, ctx });
	}

	/** @description Validate a password reset token */
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
