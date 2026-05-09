import { defineErrors } from "../../utils/errors";

export const authErrors = defineErrors({
	AUTH_EMAIL_ALREADY_USED: {
		code: "email_already_used",
		message: "Email is already registered.",
		status: 409,
	},
	AUTH_USER_NOT_FOUND: {
		code: "user_not_found",
		message: "User not found",
		status: 404,
	},
	AUTH_EMAIL_NOT_VERIFIED: {
		code: "email_not_verified",
		message: "Email not verified",
		status: 403,
	},
	AUTH_INVALID_PASSWORD: {
		code: "invalid_password",
		message: "Invalid password",
		status: 401,
	},
	AUTH_TOKEN_NOT_FOUND: {
		code: "token_not_found",
		message: "Token not found",
		status: 404,
	},
	AUTH_TOKEN_EXPIRED: {
		code: "token_expired",
		message: "Token expired",
		status: 410,
	},
	AUTH_INVALID_TOKEN: {
		code: "invalid_token",
		message: "Invalid token",
		status: 400,
	},
	AUTH_NO_REFRESH_PROVIDED: {
		code: "no_refresh_provided",
		message: "No refresh token provided",
		status: 400,
	},
	AUTH_INVALID_REFRESH: {
		code: "invalid_refresh",
		message: "Invalid refresh token",
		status: 401,
	},
	AUTH_REFRESH_EXPIRED: {
		code: "refresh_expired",
		message: "Refresh token expired",
		status: 410,
	},
	AUTH_MISSING_CODE: {
		code: "missing_code",
		message: "Missing authorization code from Google",
		status: 422,
	},
	AUTH_MISSING_ID_TOKEN: {
		code: "missing_id_token",
		message: "No ID token returned from Google",
		status: 502,
	},
	AUTH_GOOGLE_FAILED: {
		code: "google_auth_failed",
		message: "Failed to authenticate with Google",
		status: 500,
	},
	AUTH_VERIFICATION_EMAIL_FAILED: {
		code: "verification_email_failed",
		message: "Failed to send verification email",
		status: 500,
	},
	AUTH_GOOGLE_INIT_FAILED: {
		code: "google_auth_init_failed",
		message: "Failed to initialize Google authentication",
		status: 500,
	},
	AUTH_NOT_IMPLEMENTED: {
		code: "not_implemented",
		message: "This endpoint is not implemented or disabled.",
		status: 501,
	},
	// Shared across auth handlers
	AUTH_MISSING_EMAIL: {
		code: "gacc_missing_email",
		message: "Google account missing email",
		status: 422,
	},
	AUTH_GOOGLE_USER_NOT_FOUND: {
		code: "gacc_user_not_found",
		message: "User not found for Google account",
		status: 404,
	},
});
