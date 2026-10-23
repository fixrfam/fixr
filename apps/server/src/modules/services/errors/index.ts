import { defineErrors } from "../../../core/utils/errors";

/** @description Error definitions for the (repair) services module */
export const servicesErrors = defineErrors({
	SERVICE_COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
	SERVICE_NOT_ALLOWED: {
		code: "not_allowed",
		message: "You are not authorized to access this company.",
		status: 403,
	},
	SERVICE_NOT_FOUND: {
		code: "service_not_found",
		message: "Service not found.",
		status: 404,
	},
	SERVICE_PART_NOT_FOUND: {
		code: "service_part_not_found",
		message: "One or more parts do not exist in this company.",
		status: 400,
	},
	SERVICE_PAGE_OUT_OF_BOUNDS: {
		code: "page_out_of_bounds",
		message: "The requested page exceeds the total number of pages.",
		status: 416,
	},
});
