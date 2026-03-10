import type { userJWT } from "@fixr/schemas/auth";
import type { changePasswordAuthenticatedSchema } from "@fixr/schemas/credentials";
import bcrypt from "bcryptjs";
import type { z } from "zod";
import { apiResponse } from "@/src/helpers/response";
import { hashPassword } from "../../helpers/hash-password";
import { queryUserById } from "../../services/auth.services";
import { updateUserPassword } from "../../services/credentials.services";

export async function changePasswordAuthenticatedHandler({
	user,
	body,
}: {
	user: z.infer<typeof userJWT>;
	body: z.infer<typeof changePasswordAuthenticatedSchema>;
}) {
	const userData = await queryUserById(user.id);

	const validPassword = await bcrypt.compare(body.old, userData.passwordHash);

	if (!validPassword) {
		return {
			status: 401,
			response: apiResponse({
				status: 401,
				error: "Unauthorized",
				code: "invalid_password",
				message: "Invalid password",
				data: null,
			}),
		} as const;
	}

	if (body.old === body.new) {
		return {
			status: 400,
			response: apiResponse({
				status: 400,
				error: "Bad Request",
				code: "equal_passwords",
				message: "Old password and new password are the same",
				data: null,
			}),
		} as const;
	}

	const hashedPassword = await hashPassword(body.new);
	await updateUserPassword(user.id, hashedPassword);

	return {
		status: 200,
		response: apiResponse({
			status: 200,
			error: null,
			code: "password_update_success",
			message: "Password updated successfully!",
			data: null,
		}),
	} as const;
}
