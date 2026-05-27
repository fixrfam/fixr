import { defineErrors } from "../../../core/utils/errors";

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
	CPF_CONFLICT: {
		code: "cpf_conflict",
		message: "CPF is already registered.",
		status: 409,
	},
	CNPJ_CONFLICT: {
		code: "cnpj_conflict",
		message: "CNPJ is already registered.",
		status: 409,
	},
	EMAIL_ALREADY_EXISTS: {
		code: "email_already_exists",
		message: "Email is already used.",
		status: 409,
	},
	SUBDOMAIN_TAKEN: {
		code: "subdomain_taken",
		message: "Subdomain is already taken.",
		status: 409,
	},
});
