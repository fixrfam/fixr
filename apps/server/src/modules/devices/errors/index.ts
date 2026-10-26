import { defineErrors } from "../../../core/utils/errors";

/** @description Error definitions for the customer devices module */
export const devicesErrors = defineErrors({
	DEVICE_COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
	DEVICE_NOT_ALLOWED: {
		code: "not_allowed",
		message: "You are not authorized to access this company.",
		status: 403,
	},
	DEVICE_NOT_FOUND: {
		code: "device_not_found",
		message: "Device not found.",
		status: 404,
	},
	DEVICE_CLIENT_NOT_FOUND: {
		code: "device_client_not_found",
		message: "The customer does not exist in this company.",
		status: 400,
	},
	DEVICE_MODEL_NOT_FOUND: {
		code: "device_model_not_found",
		message: "The model does not exist in the catalog.",
		status: 400,
	},
	DEVICE_PAGE_OUT_OF_BOUNDS: {
		code: "page_out_of_bounds",
		message: "The requested page exceeds the total number of pages.",
		status: 416,
	},
});
