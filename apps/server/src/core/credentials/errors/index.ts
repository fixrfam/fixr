import { defineErrors } from "../../utils/errors";

export const credentialsErrors = defineErrors({
	CREDENTIALS_INVALID_PASSWORD: {
		code: "invalid_password",
		message: "Invalid password",
		status: 401,
	},
	CREDENTIALS_EQUAL_PASSWORDS: {
		code: "equal_passwords",
		message: "Old password and new password are the same",
		status: 400,
	},
	CREDENTIALS_EXISTING_RESET_REQUEST: {
		code: "existing_password_reset_request",
		message:
			"Password reset request already exists. Finish it or wait until expiration (30 minutes from request) to issue a new one.",
		status: 409,
	},
	CREDENTIALS_TOKEN_NOT_FOUND: {
		code: "token_not_found",
		message: "Token not found",
		status: 404,
	},
	CREDENTIALS_TOKEN_EXPIRED: {
		code: "token_expired",
		message: "Token expired",
		status: 410,
	},
	CREDENTIALS_INVALID_TOKEN: {
		code: "invalid_token",
		message: "Invalid token",
		status: 400,
	},
	CREDENTIALS_USER_NOT_FOUND: {
		code: "user_not_found",
		message: "User not found",
		status: 404,
	},
});
