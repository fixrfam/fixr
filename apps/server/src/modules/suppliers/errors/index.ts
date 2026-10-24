import { defineErrors } from "../../../core/utils/errors";

/** @description Error definitions for the suppliers module */
export const suppliersErrors = defineErrors({
	SUPPLIER_COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
	SUPPLIER_NOT_ALLOWED: {
		code: "not_allowed",
		message: "You are not authorized to access this company.",
		status: 403,
	},
	SUPPLIER_NOT_FOUND: {
		code: "supplier_not_found",
		message: "Supplier not found.",
		status: 404,
	},
	SUPPLIER_CNPJ_CONFLICT: {
		code: "supplier_cnpj_conflict",
		message: "A supplier with this CNPJ already exists in this company.",
		status: 409,
	},
	SUPPLIER_IN_USE: {
		code: "supplier_in_use",
		message: "This supplier still has parts linked to it.",
		status: 409,
	},
	SUPPLIER_PAGE_OUT_OF_BOUNDS: {
		code: "page_out_of_bounds",
		message: "The requested page exceeds the total number of pages.",
		status: 416,
	},
});
