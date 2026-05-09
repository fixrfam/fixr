import type { userJWT } from "@fixr/schemas/auth";
import type {
	changePasswordAuthenticatedSchema,
	confirmPasswordResetSchema,
} from "@fixr/schemas/credentials";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { CredentialsService } from "../services";

/** @description Credentials request handlers */
export class CredentialsController {
	/**
	 * @description Change password for authenticated user
	 */
	static changePasswordAuthenticated({
		user,
		body,
		response,
	}: {
		user: z.infer<typeof userJWT>;
		body: z.infer<typeof changePasswordAuthenticatedSchema>;
		response: FastifyReply;
	}) {
		return CredentialsService.changePasswordAuthenticated({
			user,
			body,
			response,
		});
	}

	/**
	 * @description Request a password reset email
	 */
	static requestPasswordReset({
		email,
		response,
	}: {
		email: string;
		response: FastifyReply;
	}) {
		return CredentialsService.requestPasswordReset({
			email,
			response,
		});
	}

	/**
	 * @description Confirm password reset with token
	 */
	static confirmPasswordReset({
		body,
		response,
	}: {
		body: z.infer<typeof confirmPasswordResetSchema>;
		response: FastifyReply;
	}) {
		return CredentialsService.confirmPasswordReset({ body, response });
	}

	/**
	 * @description Validate a password reset token
	 */
	static validatePasswordResetToken({
		token,
		response,
	}: {
		token: string;
		response: FastifyReply;
	}) {
		return CredentialsService.validatePasswordResetToken({ token, response });
	}
}
