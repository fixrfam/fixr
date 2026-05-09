import { accountErrors } from "../account/errors";
import { authErrors } from "../auth/errors";
import { companiesErrors } from "../companies/errors";
import { credentialsErrors } from "../credentials/errors";
import { employeesErrors } from "../employees/errors";
import { tokensErrors } from "../tokens/errors";
import { defineErrors } from "../utils/errors";

export const errors = defineErrors({
	...authErrors,
	...accountErrors,
	...credentialsErrors,
	...companiesErrors,
	...employeesErrors,
	...tokensErrors,

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
});

export type ErrorKey = keyof typeof errors;
