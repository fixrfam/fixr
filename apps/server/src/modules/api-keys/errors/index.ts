import { defineErrors } from "../../../core/utils/errors";

export const apiKeysErrors = defineErrors({
	API_KEY_COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
	API_KEY_COMPANY_NOT_ALLOWED: {
		code: "not_allowed",
		message: "You are not allowed to access this company.",
		status: 403,
	},
	API_KEY_NOT_FOUND: {
		code: "api_key_not_found",
		message: "API key not found.",
		status: 404,
	},
	API_KEY_ALREADY_REVOKED: {
		code: "api_key_already_revoked",
		message: "This API key has already been revoked.",
		status: 409,
	},
	API_KEY_NAME_CONFLICT: {
		code: "api_key_name_conflict",
		message: "An active API key with this name already exists.",
		status: 409,
	},
	API_KEY_INVALID_SCOPES: {
		code: "api_key_invalid_scopes",
		message: "Scopes must be a subset of your own permissions.",
		status: 403,
	},
	API_KEY_EXPIRATION_TOO_FAR: {
		code: "api_key_expiration_too_far",
		message: "Expiration date exceeds the maximum allowed lifetime.",
		status: 400,
	},
	API_KEY_PAGE_OUT_OF_BOUNDS: {
		code: "page_out_of_bounds",
		message: "The requested page exceeds the total number of pages.",
		status: 416,
	},
	API_KEY_CREDENTIALS_INVALID: {
		code: "api_key_credentials_invalid",
		message: "API key is missing, malformed or invalid.",
		status: 401,
	},
	API_KEY_EXPIRED: {
		code: "api_key_expired",
		message: "This API key has expired.",
		status: 401,
	},
	API_KEY_REVOKED: {
		code: "api_key_revoked",
		message: "This API key has been revoked.",
		status: 401,
	},
});
