import { defineErrors } from "../../../core/utils/errors";

export const accountErrors = defineErrors({
	ACCOUNT_EXISTING_DELETION_REQUEST: {
		code: "existing_deletion_request",
		message:
			"Deletion request already exists. Finish it or wait until expiration to request a new one.",
		status: 409,
	},
	ACCOUNT_TOKEN_NOT_FOUND: {
		code: "token_not_found",
		message: "Token not found",
		status: 404,
	},
	ACCOUNT_TOKEN_EXPIRED: {
		code: "token_expired",
		message: "Token expired",
		status: 410,
	},
	ACCOUNT_INVALID_TOKEN: {
		code: "invalid_token",
		message: "Invalid token",
		status: 400,
	},
});
