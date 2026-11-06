import type {
	createEstimateSchema,
	estimateStatuses,
	rejectEstimateSchema,
	sendEstimateSchema,
} from "@fixr/schemas/estimates";
import type { ApiResponse, PaginatedData } from "@fixr/schemas/utils";
import type { z } from "zod";
import { axios } from "../auth/axios";
import type { ServiceOrderStatus } from "./service-orders";

export type EstimateStatus = z.infer<typeof estimateStatuses>;

export interface Estimate {
	id: string;
	serviceOrderId: string;
	number: number;
	status: EstimateStatus;
	discountPercentage: number;
	validUntil: string;
	notes: string | null;
	sentTo: string | null;
	sentAt: string | null;
	respondedAt: string | null;
	rejectionReason: string | null;
	createdAt: string;
	updatedAt: string;
	client: {
		id: string;
		name: string;
		phone: string | null;
		email: string | null;
	} | null;
	/** The order the estimate was made from. */
	serviceOrder: { id: string; number: number; status: string };
	device: {
		model: { id: string; name: string; slug: string; imageUrl: string | null };
		maker: string;
		category: string | null;
	};
	itemsCount: number;
	totals: EstimateTotals;
}

export interface EstimateTotals {
	parts: number;
	services: number;
	subtotal: number;
	discount: number;
	total: number;
}

export interface EstimateItem {
	id: string;
	parentItemId: string | null;
	type: "part" | "service";
	name: string;
	quantity: number;
	unitPrice: number;
	total: number;
}

export interface EstimateDetail extends Estimate {
	/** In reading order: the parts a service uses come right after it. */
	items: EstimateItem[];
}

export interface EstimatesQuery {
	page: number;
	perPage?: number;
	query?: string;
	status?: EstimateStatus;
	clientId?: string;
	serviceOrderId?: string;
}

/** What the client sees through the link sent by email. */
export interface PublicEstimate {
	number: number;
	status: EstimateStatus;
	validUntil: string;
	expired: boolean;
	discountPercentage: number;
	notes: string | null;
	sentAt: string | null;
	respondedAt: string | null;
	rejectionReason: string | null;
	company: {
		name: string;
		email: string | null;
		phone: string | null;
		website: string | null;
		logoUrl: string | null;
	};
	client: { name: string } | null;
	serviceOrder: { code: string; status: ServiceOrderStatus; openedAt: string };
	device: {
		maker: string;
		model: string;
		category: string | null;
		imageUrl: string | null;
		reportedDefect: string;
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
	totals: EstimateTotals;
}

const base = (subdomain: string) => `/companies/${subdomain}/estimates`;

async function data<T>(request: Promise<{ data: ApiResponse<T> }>) {
	const response = await request;
	return response.data.data as T;
}

export const estimatesApi = {
	list: (subdomain: string, { perPage = 20, ...query }: EstimatesQuery) =>
		data<PaginatedData<Estimate>>(
			axios.get(base(subdomain), {
				params: Object.fromEntries(
					Object.entries({ perPage, ...query }).filter(
						([, value]) => value !== undefined && value !== ""
					)
				),
			})
		),
	get: (subdomain: string, id: string) =>
		data<EstimateDetail>(axios.get(`${base(subdomain)}/${id}`)),
	create: (subdomain: string, values: z.input<typeof createEstimateSchema>) =>
		data<EstimateDetail>(axios.post(base(subdomain), values)),
	updateStatus: (subdomain: string, id: string, status: EstimateStatus) =>
		data<Estimate>(axios.patch(`${base(subdomain)}/${id}/status`, { status })),
	/** Email the estimate to the client (with the approval link). */
	send: (
		subdomain: string,
		id: string,
		values: z.input<typeof sendEstimateSchema>
	) => data<Estimate>(axios.post(`${base(subdomain)}/${id}/send`, values)),
	remove: (subdomain: string, id: string) =>
		axios.delete(`${base(subdomain)}/${id}`),
	/** The PDF as a blob URL, to open in a new tab. */
	pdfUrl: async (subdomain: string, id: string) => {
		const response = await axios.get<Blob>(`${base(subdomain)}/${id}/pdf`, {
			responseType: "blob",
		});
		return URL.createObjectURL(response.data);
	},
};

const link = (token: string) => `/estimate-links/${encodeURIComponent(token)}`;

/** Public estimate link: the token from the email is the only credential. */
export const estimateLinksApi = {
	get: (token: string) => data<PublicEstimate>(axios.get(link(token))),
	/** Direct URL of the PDF (public, so a plain link works). */
	pdfUrl: (token: string) => axios.getUri({ url: `${link(token)}/pdf` }),
	approve: (token: string) =>
		data<PublicEstimate>(axios.post(`${link(token)}/approve`, {})),
	reject: (token: string, values: z.input<typeof rejectEstimateSchema>) =>
		data<PublicEstimate>(axios.post(`${link(token)}/reject`, values)),
};
