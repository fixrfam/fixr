import { defineErrors } from "../../utils/errors";

export const companiesErrors = defineErrors({
	COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "Company not found",
		status: 404,
	},
	COMPANY_USER_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
	COMPANY_NOT_ALLOWED: {
		code: "not_allowed",
		message: "You are not authorized to access this company.",
		status: 403,
	},
});
