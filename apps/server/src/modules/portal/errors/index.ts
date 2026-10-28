import { defineErrors } from "../../../core/utils/errors";

/** @description Error definitions for the client portal */
export const portalErrors = defineErrors({
	PORTAL_UNAUTHORIZED: {
		code: "portal_unauthorized",
		message: "Open the link from your email to access the portal.",
		status: 401,
	},
	PORTAL_LINK_INVALID: {
		code: "portal_link_invalid",
		message: "This portal link is invalid or was replaced.",
		status: 404,
	},
	PORTAL_SERVICE_ORDER_NOT_FOUND: {
		code: "service_order_not_found",
		message: "Service order not found.",
		status: 404,
	},
	PORTAL_ESTIMATE_NOT_FOUND: {
		code: "estimate_not_found",
		message: "Estimate not found.",
		status: 404,
	},
	PORTAL_COMPANY_NOT_FOUND: {
		code: "company_not_found",
		message: "There's no companies bound to your account",
		status: 404,
	},
	PORTAL_NOT_ALLOWED: {
		code: "not_allowed",
		message: "You are not authorized to access this company.",
		status: 403,
	},
	PORTAL_CLIENT_NOT_FOUND: {
		code: "client_not_found",
		message: "Client not found.",
		status: 404,
	},
	PORTAL_CLIENT_NO_EMAIL: {
		code: "portal_client_no_email",
		message: "The client has no email to send the portal access to.",
		status: 400,
	},
});
