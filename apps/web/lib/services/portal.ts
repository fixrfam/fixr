import { env } from "@fixr/env/web";
import type { rejectEstimateSchema } from "@fixr/schemas/estimates";
import type { requestPortalAccessSchema } from "@fixr/schemas/portal";
import type { ApiResponse } from "@fixr/schemas/utils";
import axiosBase from "axios";
import type { z } from "zod";
import { axios } from "../auth/axios";
import type { EstimateStatus, EstimateTotals } from "./estimates";

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
	createdAt: string;
	updatedAt: string;
	company: { name: string; logoUrl: string | null };
	pendingEstimate: boolean;
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
	reportedDefect: string;
	createdAt: string;
	updatedAt: string;
	company: {
		name: string;
		email: string | null;
		phone: string | null;
		website: string | null;
		address: string | null;
		logoUrl: string | null;
	};
	items: {
		type: "part" | "service";
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
	/** Sign this browser in from the link in an estimate email. */
	openFromEstimate: (token: string) =>
		portalAxios.post("/portal/session/estimate", { token }),
	signOut: () => portalAxios.delete("/portal/session"),
	requestAccess: (values: z.input<typeof requestPortalAccessSchema>) =>
		portalAxios.post("/portal/access", values),
	me: () =>
		data<{ name: string | null; email: string }>(portalAxios.get("/portal/me")),
	serviceOrders: () =>
		data<PortalServiceOrderSummary[]>(
			portalAxios.get("/portal/service-orders")
		),
	serviceOrder: (id: string) =>
		data<PortalServiceOrder>(
			portalAxios.get(`/portal/service-orders/${encodeURIComponent(id)}`)
		),
	/** Direct URL of an estimate PDF (the session cookie goes with the navigation). */
	estimatePdfUrl: (estimateId: string) =>
		portalAxios.getUri({
			url: `/portal/estimates/${encodeURIComponent(estimateId)}/pdf`,
		}),
	approveEstimate: (estimateId: string) =>
		data<PortalServiceOrder>(
			portalAxios.post(`/portal/estimates/${estimateId}/approve`, {})
		),
	rejectEstimate: (
		estimateId: string,
		values: z.input<typeof rejectEstimateSchema>
	) =>
		data<PortalServiceOrder>(
			portalAxios.post(`/portal/estimates/${estimateId}/reject`, values)
		),
};

/** Shop side: email portal access to one of the company's customers. */
export const sendPortalAccess = (subdomain: string, customerId: string) =>
	axios.post(`/companies/${subdomain}/customers/${customerId}/portal-access`);
