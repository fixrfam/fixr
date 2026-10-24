import type {
	createEstimateSchema,
	estimateStatuses,
} from "@fixr/schemas/estimates";
import type { ApiResponse, PaginatedData } from "@fixr/schemas/utils";
import type { z } from "zod";
import { axios } from "../auth/axios";

export type EstimateStatus = z.infer<typeof estimateStatuses>;

export interface Estimate {
	id: string;
	serviceOrderId: string;
	number: number;
	status: EstimateStatus;
	discountPercentage: number;
	validUntil: string;
	notes: string | null;
	createdAt: string;
	client: { id: string; name: string } | null;
	totals: {
		parts: number;
		services: number;
		subtotal: number;
		discount: number;
		total: number;
	};
}

const base = (subdomain: string) => `/companies/${subdomain}/estimates`;

async function data<T>(request: Promise<{ data: ApiResponse<T> }>) {
	const response = await request;
	return response.data.data as T;
}

export const estimatesApi = {
	list: (subdomain: string, page: number, status?: EstimateStatus) =>
		data<PaginatedData<Estimate>>(
			axios.get(base(subdomain), {
				params: { page, perPage: 20, ...(status ? { status } : {}) },
			})
		),
	create: (subdomain: string, values: z.input<typeof createEstimateSchema>) =>
		data<Estimate>(axios.post(base(subdomain), values)),
	updateStatus: (subdomain: string, id: string, status: EstimateStatus) =>
		data<Estimate>(axios.patch(`${base(subdomain)}/${id}/status`, { status })),
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
