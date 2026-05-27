import { defineErrors } from "../../../core/utils/errors";

export const serviceOrdersErrors = defineErrors({
	SERVICE_ORDER_COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
	SERVICE_ORDER_NOT_ALLOWED: {
		code: "not_allowed",
		message: "You are not authorized to access this company.",
		status: 403,
	},
	SERVICE_ORDER_EMPLOYEE_NOT_FOUND: {
		code: "employee_not_found",
		message: "Employee profile not found for this account.",
		status: 403,
	},
	SERVICE_ORDER_CLIENT_NOT_FOUND: {
		code: "client_not_found",
		message: "Client not found.",
		status: 404,
	},
	SERVICE_ORDER_DEVICE_BRAND_NOT_FOUND: {
		code: "device_brand_not_found",
		message: "Device brand not found.",
		status: 404,
	},
	SERVICE_ORDER_DEVICE_CATEGORY_NOT_FOUND: {
		code: "device_category_not_found",
		message: "Device category not found.",
		status: 404,
	},
	SERVICE_ORDER_INVALID_PHOTO_URL: {
		code: "invalid_photo_url",
		message: "Photo URL must come from a pre-signed upload for this company.",
		status: 400,
	},
	SERVICE_ORDER_PAGE_OUT_OF_BOUNDS: {
		code: "page_out_of_bounds",
		message: "The requested page exceeds the total number of pages.",
		status: 416,
	},
});
