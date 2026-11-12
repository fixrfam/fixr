import { defineErrors } from "../../../core/utils/errors";

/** @description Error definitions for the estimates module */
export const estimatesErrors = defineErrors({
	ESTIMATE_COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
	ESTIMATE_NOT_ALLOWED: {
		code: "not_allowed",
		message: "You are not authorized to access this company.",
		status: 403,
	},
	ESTIMATE_NOT_FOUND: {
		code: "estimate_not_found",
		message: "Estimate not found.",
		status: 404,
	},
	ESTIMATE_SERVICE_ORDER_NOT_FOUND: {
		code: "estimate_service_order_not_found",
		message: "The service order does not exist in this company.",
		status: 400,
	},
	ESTIMATE_SERVICE_ORDER_EMPTY: {
		code: "estimate_service_order_empty",
		message: "Add parts or services to the service order before estimating it.",
		status: 400,
	},
	ESTIMATE_NOT_EDITABLE: {
		code: "estimate_not_editable",
		message: "Only draft estimates can be changed or deleted.",
		status: 409,
	},
	ESTIMATE_INVALID_TRANSITION: {
		code: "estimate_invalid_transition",
		message: "The estimate can't move to this status from its current one.",
		status: 409,
	},
	ESTIMATE_NO_RECIPIENT: {
		code: "estimate_no_recipient",
		message:
			"The customer has no email. Send the estimate to an email address.",
		status: 400,
	},
	ESTIMATE_EXPIRED: {
		code: "estimate_expired",
		message: "The estimate's validity date has passed.",
		status: 410,
	},
	ESTIMATE_LINK_INVALID: {
		code: "estimate_link_invalid",
		message: "This estimate link is invalid or was replaced.",
		status: 404,
	},
	ESTIMATE_ALREADY_ANSWERED: {
		code: "estimate_already_answered",
		message: "The estimate was already approved or rejected.",
		status: 409,
	},
	ESTIMATE_PAGE_OUT_OF_BOUNDS: {
		code: "page_out_of_bounds",
		message: "The requested page exceeds the total number of pages.",
		status: 416,
	},
});
