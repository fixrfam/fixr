import { defineErrors } from "../../../core/utils/errors";

/** @description Error definitions for the customers (customers) module */
export const customersErrors = defineErrors({
	CUSTOMER_COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
	CUSTOMER_NOT_ALLOWED: {
		code: "not_allowed",
		message: "You are not authorized to access this company.",
		status: 403,
	},
	CUSTOMER_NOT_FOUND: {
		code: "customer_not_found",
		message: "Customer not found.",
		status: 404,
	},
	CUSTOMER_CPF_CONFLICT: {
		code: "customer_cpf_conflict",
		message: "A customer with this CPF already exists in this company.",
		status: 409,
	},
	CUSTOMER_PHONE_INVALID: {
		code: "customer_phone_invalid",
		message: "Phone numbers must have 10 or 11 digits.",
		status: 400,
	},
	CUSTOMER_PAGE_OUT_OF_BOUNDS: {
		code: "page_out_of_bounds",
		message: "The requested page exceeds the total number of pages.",
		status: 416,
	},
});
