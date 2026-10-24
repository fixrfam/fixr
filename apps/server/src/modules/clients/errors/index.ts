import { defineErrors } from "../../../core/utils/errors";

/** @description Error definitions for the clients (customers) module */
export const clientsErrors = defineErrors({
	CLIENT_COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
	CLIENT_NOT_ALLOWED: {
		code: "not_allowed",
		message: "You are not authorized to access this company.",
		status: 403,
	},
	CLIENT_NOT_FOUND: {
		code: "client_not_found",
		message: "Client not found.",
		status: 404,
	},
	CLIENT_CPF_CONFLICT: {
		code: "client_cpf_conflict",
		message: "A client with this CPF already exists in this company.",
		status: 409,
	},
	CLIENT_PHONE_INVALID: {
		code: "client_phone_invalid",
		message: "Phone numbers must have 10 or 11 digits.",
		status: 400,
	},
	CLIENT_PAGE_OUT_OF_BOUNDS: {
		code: "page_out_of_bounds",
		message: "The requested page exceeds the total number of pages.",
		status: 416,
	},
});
