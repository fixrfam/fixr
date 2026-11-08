import { env } from "@fixr/env/web";
import type { rejectEstimateSchema } from "@fixr/schemas/estimates";
import type { requestPortalAccessSchema } from "@fixr/schemas/portal";
import type { ApiResponse } from "@fixr/schemas/utils";
import axiosBase from "axios";
import type { z } from "zod";
import { axios } from "../auth/axios";
import type {
	EstimateStatus,
	EstimateTotals,
	PublicEstimate,
} from "./estimates";

/**
 * Customer portal requests. Customers are not employees, so this is a separate
 * instance without the employee session refresh: the portal session is its
 * own httpOnly cookie, sent with `withCredentials`.
 */
const portalAxios = axiosBase.create({
	baseURL: env.NEXT_PUBLIC_API_URL,
	withCredentials: true,
});

export type PortalServiceOrderStatus =
	| "pending"
	| "diagnosing"
	| "waiting_approval"
	| "approved"
	| "fixing"
	| "ready"
	| "delivered";

export interface PortalServiceOrderSummary {
	id: string;
	/** How the shop refers to the order, e.g. `ACME-12`. */
	code: string;
	status: PortalServiceOrderStatus;
	deviceMaker: string;
	deviceModel: string;
	deviceCategory: string | null;
	deviceImageUrl: string | null;
	createdAt: string;
	updatedAt: string;
	company: { name: string; logoUrl: string | null };
	pendingEstimate: boolean;
}

/** An estimate as the customer sees it, with the ids the portal links by. */
export interface PortalEstimateView extends PublicEstimate {
	id: string;
	serviceOrderId: string;
}

export interface PortalEstimateSummary {
	id: string;
	number: number;
	status: EstimateStatus;
	validUntil: string;
	sentAt: string | null;
	respondedAt: string | null;
	expired: boolean;
	serviceOrderId: string;
	serviceOrderCode: string;
	company: { name: string; logoUrl: string | null };
	deviceMaker: string;
	deviceModel: string;
	deviceCategory: string | null;
	deviceImageUrl: string | null;
	totals: EstimateTotals;
}

export interface PortalShop {
	name: string;
	logoUrl: string | null;
	email: string | null;
	phone: string | null;
	website: string | null;
}

export interface PortalMe {
	name: string | null;
	email: string;
	cpf: string;
	shops: PortalShop[];
}

export interface PortalEstimate {
	id: string;
	number: number;
	status: EstimateStatus;
	discountPercentage: number;
	validUntil: string;
	respondedAt: string | null;
	rejectionReason: string | null;
	expired: boolean;
	totals: EstimateTotals;
}

export interface PortalServiceOrder {
	id: string;
	/** How the shop refers to the order, e.g. `ACME-12`. */
	code: string;
	status: PortalServiceOrderStatus;
	deviceMaker: string;
	deviceModel: string;
	deviceCategory: string | null;
	deviceImageUrl: string | null;
	reportedDefect: string;
	createdAt: string;
	updatedAt: string;
	/** When the order reached each status, oldest first. */
	history: { status: PortalServiceOrderStatus; at: string }[];
	company: {
		name: string;
		email: string | null;
		phone: string | null;
		website: string | null;
		address: string | null;
		logoUrl: string | null;
	};
	/** In reading order: the parts a service uses come right after it. */
	items: {
		type: "part" | "service";
		/** A part the service above uses. */
		nested: boolean;
		name: string;
		quantity: number;
		unitPrice: number;
		total: number;
	}[];
	estimates: PortalEstimate[];
}

async function data<T>(request: Promise<{ data: ApiResponse<T> }>) {
	const response = await request;
	return response.data.data as T;
}

export const portalApi = {
	/** Sign this browser in from the link in a portal email. */
	openFromLink: (token: string) =>
		portalAxios.post("/portal/session", { token }),
	/** Sign this browser in from the link in an estimate email; lands on that estimate. */
	openFromEstimate: (token: string) =>
		data<{ estimateId: string }>(
			portalAxios.post("/portal/session/estimate", { token })
		),
	signOut: () => portalAxios.delete("/portal/session"),
	requestAccess: (values: z.input<typeof requestPortalAccessSchema>) =>
		portalAxios.post("/portal/access", values),
	me: () => data<PortalMe>(portalAxios.get("/portal/me")),
	serviceOrders: () =>
		data<PortalServiceOrderSummary[]>(
			portalAxios.get("/portal/service-orders")
		),
	serviceOrder: (id: string) =>
		data<PortalServiceOrder>(
			portalAxios.get(`/portal/service-orders/${encodeURIComponent(id)}`)
		),
	estimates: () =>
		data<PortalEstimateSummary[]>(portalAxios.get("/portal/estimates")),
	estimate: (id: string) =>
		data<PortalEstimateView>(
			portalAxios.get(`/portal/estimates/${encodeURIComponent(id)}`)
		),
	/** Direct URL of an estimate PDF (the session cookie goes with the navigation). */
	estimatePdfUrl: (estimateId: string) =>
		portalAxios.getUri({
			url: `/portal/estimates/${encodeURIComponent(estimateId)}/pdf`,
		}),
	approveEstimate: (estimateId: string) =>
		data<PortalEstimateView>(
			portalAxios.post(`/portal/estimates/${estimateId}/approve`, {})
		),
	rejectEstimate: (
		estimateId: string,
		values: z.input<typeof rejectEstimateSchema>
	) =>
		data<PortalEstimateView>(
			portalAxios.post(`/portal/estimates/${estimateId}/reject`, values)
		),
};

/** Employee side: is the signed-in email also a customer's, and send it the portal link. */
export const employeePortal = {
	match: () =>
		data<{ customer: boolean }>(axios.get("/portal/employee-access")),
	sendLink: () => axios.post("/portal/employee-access"),
};

/** Shop side: email portal access to one of the company's customers. */
export const sendPortalAccess = (subdomain: string, customerId: string) =>
	axios.post(`/companies/${subdomain}/customers/${customerId}/portal-access`);
