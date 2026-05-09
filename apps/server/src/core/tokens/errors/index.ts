import { defineErrors } from "../../utils/errors";

export const tokensErrors = defineErrors({
	TOKEN_NOT_FOUND: {
		code: "token_not_found",
		message: "Token not found",
		status: 404,
	},
	TOKEN_EXPIRED: {
		code: "token_expired",
		message: "Token expired",
		status: 410,
	},
	TOKEN_INVALID: {
		code: "invalid_token",
		message: "Invalid token",
		status: 400,
	},
});
