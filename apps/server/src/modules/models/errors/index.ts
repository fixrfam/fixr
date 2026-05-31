import { defineErrors } from "../../../core/utils/errors";

/** @description Error definitions for the models module */
export const modelsErrors = defineErrors({
	MODEL_NOT_FOUND: {
		code: "model_not_found",
		message: "Model not found.",
		status: 404,
	},
	MODEL_PAGE_OUT_OF_BOUNDS: {
		code: "page_out_of_bounds",
		message: "The requested page exceeds the total number of pages.",
		status: 416,
	},
	MODEL_COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
	MODEL_NOT_ALLOWED: {
		code: "not_allowed",
		message: "You are not authorized to access this company.",
		status: 403,
	},
});
