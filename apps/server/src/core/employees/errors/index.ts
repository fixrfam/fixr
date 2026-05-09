import { defineErrors } from "../../utils/errors";

export const employeesErrors = defineErrors({
	EMPLOYEE_CPF_CONFLICT: {
		code: "cpf_conflict",
		message: "Cpf is already registered.",
		status: 409,
	},
	EMPLOYEE_EMAIL_ALREADY_USED: {
		code: "email_already_used",
		message: "Email is already registered.",
		status: 409,
	},
	EMPLOYEE_COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
	EMPLOYEE_NOT_ALLOWED: {
		code: "not_allowed",
		message: "You are not allowed to perform this action.",
		status: 403,
	},
	EMPLOYEE_VIOLATES_ROLE_HIERARCHY: {
		code: "violates_role_hierarchy",
		message: "Managers may only create subordinate accounts.",
		status: 403,
	},
	EMPLOYEE_PAGE_OUT_OF_BOUNDS: {
		code: "page_out_of_bounds",
		message: "The requested page exceeds the total number of pages.",
		status: 416,
	},
});
