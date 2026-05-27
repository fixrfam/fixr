import { accountErrors } from "../../modules/account/errors";
import { authErrors } from "../../modules/auth/errors";
import { companiesErrors } from "../../modules/companies/errors";
import { credentialsErrors } from "../../modules/credentials/errors";
import { employeesErrors } from "../../modules/employees/errors";
import { serviceOrdersErrors } from "../../modules/service-orders/errors";
import { tokensErrors } from "../../modules/tokens/errors";
import { uploadsErrors } from "../../modules/uploads/errors";
import { defineErrors } from "../utils/errors";

export const errors = defineErrors({
	...authErrors,
	...accountErrors,
	...credentialsErrors,
	...companiesErrors,
	...employeesErrors,
	...serviceOrdersErrors,
	...tokensErrors,
	...uploadsErrors,

	INTERNAL_ERROR: {
		code: "internal_error",
		message: "Something went wrong.",
		status: 500,
	},
	BAD_REQUEST: {
		code: "bad_request",
		message: "Type validation failed",
		status: 400,
	},
	REQUEST_VALIDATION_ERROR: {
		code: "request_validation_error",
		message: "Request doesn't match the schema",
		status: 400,
	},
	RESPONSE_SERIALIZATION_FAILED: {
		code: "response_serialization_failed",
		message: "Response doesn't match the schema",
		status: 500,
	},
	NOT_IMPLEMENTED: {
		code: "not_implemented",
		message: "This endpoint is not implemented or disabled.",
		status: 501,
	},
	RESOURCE_NOT_FOUND: {
		code: "user_not_found",
		message: "User not found",
		status: 404,
	},
	RESOURCE_FORBIDDEN: {
		code: "forbidden",
		message: "You are not allowed to perform this action.",
		status: 403,
	},
	MISSING_PERMISSIONS: {
		code: "missing_required_permissions",
		message: "You dont have the required permissions to perform this action",
		status: 403,
	},
	AUTH_JWT_INVALID: {
		code: "auth_jwt_invalid",
		message: "Authorization token is invalid or expired.",
		status: 401,
	},
	TURNSTILE_VALIDATION_FAILED: {
		code: "turnstile_validation_failed",
		message: "Security check failed. Please try again.",
		status: 403,
	},
});

export type ErrorKey = keyof typeof errors;
