import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import { rejectEstimateSchema } from "@fixr/schemas/estimates";
import {
	portalEstimateParamsSchema,
	portalServiceOrderParamsSchema,
	portalTokenSchema,
	requestPortalAccessSchema,
} from "@fixr/schemas/portal";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import { publicEstimateSchema } from "./estimates.docs";
import { companyScopedErrors, conflictError, notFoundError } from "./responses";
import { zodResponseSchema } from "./types";

const TAG = "Customer portal";

const unauthorized = zodResponseSchema({
	status: 401,
	error: "Unauthorized",
	code: "portal_unauthorized",
	message: "Open the link from your email to access the portal.",
	data: null,
}).describe("No portal session (or it expired, or its link was revoked).");

const linkInvalid = notFoundError(
	"portal_link_invalid",
	"This portal link is invalid or was replaced."
);

const empty = (status: 200 | 202, code: string, message: string) =>
	zodResponseSchema({
		status,
		error: null,
		code,
		message,
		data: null,
	}).describe(message);

const serviceOrderStatus = z.enum([
	"pending",
	"diagnosing",
	"waiting_approval",
	"approved",
	"fixing",
	"ready",
	"delivered",
]);

const totalsSchema = z.object({
	parts: z.number(),
	services: z.number(),
	subtotal: z.number(),
	discount: z.number(),
	total: z.number(),
});

const serviceOrderSummary = z.object({
	id: z.string(),
	/** How the shop refers to the order, e.g. `ACME-12`. */
	code: z.string(),
	status: serviceOrderStatus,
	deviceMaker: z.string(),
	deviceModel: z.string(),
	deviceCategory: z.string().nullable(),
	deviceImageUrl: z.string().nullable(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	company: z.object({ name: z.string(), logoUrl: z.string().nullable() }),
	pendingEstimate: z.boolean(),
});

/** The estimate as the customer sees it, plus the ids the portal links by. */
const portalEstimateSchema = publicEstimateSchema.extend({
	id: z.string(),
	serviceOrderId: z.string(),
});

const portalEstimateSummary = z.object({
	id: z.string(),
	number: z.number(),
	status: z.enum(["draft", "sent", "approved", "rejected"]),
	validUntil: z.coerce.date(),
	sentAt: z.coerce.date().nullable(),
	respondedAt: z.coerce.date().nullable(),
	expired: z.boolean(),
	serviceOrderId: z.string(),
	serviceOrderCode: z.string(),
	company: z.object({ name: z.string(), logoUrl: z.string().nullable() }),
	deviceMaker: z.string(),
	deviceModel: z.string(),
	deviceCategory: z.string().nullable(),
	deviceImageUrl: z.string().nullable(),
	totals: totalsSchema,
});

const estimateResponse = (code: string, message: string) =>
	zodResponseSchema({
		status: 200,
		error: null,
		code,
		message,
		data: portalEstimateSchema,
	}).describe(message);

const serviceOrderDetail = z.object({
	id: z.string(),
	/** How the shop refers to the order, e.g. `ACME-12`. */
	code: z.string(),
	status: serviceOrderStatus,
	deviceMaker: z.string(),
	deviceModel: z.string(),
	deviceCategory: z.string().nullable(),
	deviceImageUrl: z.string().nullable(),
	reportedDefect: z.string(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	/** When the order reached each status, oldest first. */
	history: z.array(
		z.object({ status: serviceOrderStatus, at: z.coerce.date() })
	),
	company: z.object({
		name: z.string(),
		email: z.string().nullable(),
		phone: z.string().nullable(),
		website: z.string().nullable(),
		address: z.string().nullable(),
		logoUrl: z.string().nullable(),
	}),
	items: z.array(
		z.object({
			type: z.enum(["part", "service"]),
			/** A part the service listed right before it uses. */
			nested: z.boolean(),
			name: z.string(),
			quantity: z.number(),
			unitPrice: z.number(),
			total: z.number(),
		})
	),
	estimates: z.array(
		z.object({
			id: z.string(),
			number: z.number(),
			status: z.enum(["draft", "sent", "approved", "rejected"]),
			discountPercentage: z.number(),
			validUntil: z.coerce.date(),
			respondedAt: z.coerce.date().nullable(),
			rejectionReason: z.string().nullable(),
			expired: z.boolean(),
			totals: totalsSchema,
		})
	),
});

const detailResponse = (code: string, message: string) =>
	zodResponseSchema({
		status: 200,
		error: null,
		code,
		message,
		data: serviceOrderDetail,
	}).describe(message);

const openFromPortalLinkSchema: FastifySchema = {
	tags: [TAG],
	summary: "Open a portal session from a portal link",
	description: `
**Public: the customer opens the link from the portal access email.**

Sets an httpOnly portal session cookie (30 days). The link is the customer's account: there is no password. A link signs in as many times as needed for 30 days after it was sent, unless the shop sends a newer one. The session sees the service orders of every customer record (any shop) with the link's CPF **and** email, plus the record the link was issued for.
`,
	body: portalTokenSchema,
	response: {
		200: empty(200, "portal_session_opened", "Portal session opened."),
		404: linkInvalid,
	},
};

const openFromEstimateLinkSchema: FastifySchema = {
	tags: [TAG],
	summary: "Open a portal session from an estimate link",
	description: `
**Public: the customer goes from an estimate link to the portal.**

The estimate email proves the customer reads the address it was sent to, so that email (with the customer's CPF) becomes the session's identity.
`,
	body: portalTokenSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			code: "portal_session_opened",
			message: "Portal session opened.",
			data: z.object({ estimateId: z.string() }),
		}).describe("Portal session opened, landing on the estimate."),
		404: linkInvalid,
	},
};

const signOutSchema: FastifySchema = {
	tags: [TAG],
	summary: "Sign out of the portal",
	description: "Ends the portal session of this browser and clears its cookie.",
	response: {
		200: empty(200, "portal_signed_out", "Signed out of the portal."),
	},
};

const requestAccessSchema: FastifySchema = {
	tags: [TAG],
	summary: "Ask for a portal link",
	description: `
**Public, Turnstile-protected: the customer asks for a new link by email.**

A link is emailed for each CPF registered with this email, in any shop. The answer is always \`202\`, whether or not the email exists.
`,
	body: requestPortalAccessSchema,
	response: {
		202: empty(
			202,
			"portal_access_requested",
			"If the email is registered, a link was sent."
		),
	},
};

const meSchema: FastifySchema = {
	tags: [TAG],
	summary: "Portal profile",
	description:
		"Name, email and CPF of the signed-in customer, with the shops they are a customer of.",
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			code: "portal_me_success",
			message: "Portal profile retrieved.",
			data: z.object({
				name: z.string().nullable(),
				email: z.string(),
				cpf: z.string(),
				shops: z.array(
					z.object({
						name: z.string(),
						logoUrl: z.string().nullable(),
						email: z.string().nullable(),
						phone: z.string().nullable(),
						website: z.string().nullable(),
					})
				),
			}),
		}).describe("Portal profile retrieved."),
		401: unauthorized,
	},
};

const listServiceOrdersSchema: FastifySchema = {
	tags: [TAG],
	summary: "List the customer's service orders",
	description:
		"Service orders of every shop the customer is registered at (same CPF and email), newest first. `pendingEstimate` flags an estimate waiting for the customer's answer.",
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			code: "portal_service_orders_success",
			message: "Service orders retrieved.",
			data: z.array(serviceOrderSummary),
		}).describe("Service orders retrieved."),
		401: unauthorized,
	},
};

const getServiceOrderSchema: FastifySchema = {
	tags: [TAG],
	summary: "Get one of the customer's service orders",
	description:
		"Device, status, the shop's contact data, parts and services, and the estimates the customer was sent (drafts stay internal). Internal notes are never exposed.",
	params: portalServiceOrderParamsSchema,
	response: {
		200: detailResponse(
			"portal_service_order_success",
			"Service order retrieved."
		),
		401: unauthorized,
		404: notFoundError("service_order_not_found", "Service order not found."),
	},
};

const estimateNotFound = notFoundError(
	"estimate_not_found",
	"Estimate not found."
);

const answerErrors = {
	401: unauthorized,
	404: estimateNotFound,
	409: conflictError(
		"estimate_already_answered",
		"The estimate was already approved or rejected."
	),
	410: zodResponseSchema({
		status: 410,
		error: "Gone",
		code: "estimate_expired",
		message: "The estimate's validity date has passed.",
		data: null,
	}).describe("The validity date has passed."),
};

const employeeMatchSchema: FastifySchema = {
	tags: [TAG],
	summary: "Is the signed-in user also a customer?",
	description:
		"Whether the email of the signed-in account is registered as a customer in some shop, so the login can offer the customer portal next to the company.",
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			code: "portal_employee_match_success",
			message: "Portal match checked.",
			data: z.object({ customer: z.boolean() }),
		}).describe("Portal match checked."),
	},
	security: [{ JWT: [] }],
};

const employeeAccessSchema: FastifySchema = {
	tags: [TAG],
	summary: "Email portal access to the signed-in user",
	description:
		"Sends portal links to the email of the signed-in account (one per CPF registered with it). The password proves the account, not the inbox, so the portal still opens from the email.",
	response: {
		202: empty(
			202,
			"portal_access_requested",
			"If the email is registered, a link was sent."
		),
	},
	security: [{ JWT: [] }],
};

const listEstimatesSchema: FastifySchema = {
	tags: [TAG],
	summary: "List the customer's estimates",
	description:
		"Estimates the customer was sent in every shop (drafts stay internal), newest first, with the order and device they are about.",
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			code: "portal_estimates_success",
			message: "Estimates retrieved.",
			data: z.array(portalEstimateSummary),
		}).describe("Estimates retrieved."),
		401: unauthorized,
	},
};

const getEstimateSchema: FastifySchema = {
	tags: [TAG],
	summary: "Get one of the customer's estimates",
	description:
		"The estimate as the customer sees it: the shop, the order and the device, the items and totals, and its answer.",
	params: portalEstimateParamsSchema,
	response: {
		200: estimateResponse("portal_estimate_success", "Estimate retrieved."),
		401: unauthorized,
		404: estimateNotFound,
	},
};

const getEstimatePdfSchema: FastifySchema = {
	tags: [TAG],
	summary: "Download an estimate PDF",
	description:
		"PDF of an estimate the customer was sent (`application/pdf`, inline).",
	params: portalEstimateParamsSchema,
	response: { 401: unauthorized, 404: estimateNotFound },
};

const approveEstimateSchema: FastifySchema = {
	tags: [TAG],
	summary: "Approve an estimate",
	description:
		"Same rules as the estimate link: only a `sent`, unexpired estimate. The service order moves to `approved` unless it is already past that point. Answers with the updated estimate.",
	params: portalEstimateParamsSchema,
	response: {
		200: estimateResponse("approve_estimate_success", "Answer recorded."),
		...answerErrors,
	},
};

const rejectEstimateSchemaDoc: FastifySchema = {
	tags: [TAG],
	summary: "Reject an estimate",
	description:
		"Same rules as the estimate link, with an optional reason the shop sees. Answers with the updated estimate.",
	params: portalEstimateParamsSchema,
	body: rejectEstimateSchema,
	response: {
		200: estimateResponse("reject_estimate_success", "Answer recorded."),
		...answerErrors,
	},
};

const sendAccessSchema: FastifySchema = {
	tags: [TAG],
	summary: "Send portal access to a customer",
	description: `
**The shop emails a portal link to one of its customers.**

Requires the customer to have an email (\`400 portal_customer_no_email\`). The shop's previous links for this customer are revoked, ending the sessions opened from them.
`,
	params: getCompanyNestedDataSchema.extend({ customerId: z.string() }),
	response: {
		200: empty(
			200,
			"send_portal_access_success",
			"Portal access sent to the customer."
		),
		400: zodResponseSchema({
			status: 400,
			error: "Bad Request",
			code: "portal_customer_no_email",
			message: "The customer has no email to send the portal access to.",
			data: null,
		}).describe("The customer has no email."),
		...companyScopedErrors,
		404: notFoundError("customer_not_found", "Customer not found."),
	},
	security: [{ JWT: [] }],
};

export const portalDocs = {
	openFromPortalLinkSchema,
	openFromEstimateLinkSchema,
	signOutSchema,
	requestAccessSchema,
	meSchema,
	listServiceOrdersSchema,
	getServiceOrderSchema,
	employeeMatchSchema,
	employeeAccessSchema,
	listEstimatesSchema,
	getEstimateSchema,
	getEstimatePdfSchema,
	approveEstimateSchema,
	rejectEstimateSchema: rejectEstimateSchemaDoc,
	sendAccessSchema,
};
