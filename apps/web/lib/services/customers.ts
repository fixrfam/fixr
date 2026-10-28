import type {
	createClientSchema,
	patchClientSchema,
} from "@fixr/schemas/clients";
import type { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import type { ApiResponse, PaginatedData } from "@fixr/schemas/utils";
import type { z } from "zod";
import { axios } from "../auth/axios";

/** A company's customer, as the API sends it. */
export interface CustomerRow {
	id: string;
	name: string;
	/** Digits only. */
	cpf: string;
	email: string | null;
	/** Digits only. */
	phone: string | null;
	alternativePhone: string | null;
	address: string | null;
	city: string | null;
	state: string | null;
	createdAt: string;
}

export interface CustomerDetail extends CustomerRow {
	serviceOrders: {
		id: string;
		number: number;
		deviceId: string;
		deviceModel: string;
		status: z.infer<typeof serviceOrderStatuses>;
		createdAt: string;
	}[];
}

export interface CustomerListParams {
	page: number;
	perPage: number;
	query?: string;
	sort?: "name" | "newer" | "older";
}

/** Drops empty values so they never reach the query string. */
function toQuery(params: object) {
	return Object.fromEntries(
		Object.entries(params).filter(
			([, value]) => value !== undefined && value !== ""
		)
	);
}

async function send<T>(request: Promise<{ data: ApiResponse<T> }>) {
	const response = await request;
	return response.data.data as T;
}

const base = (subdomain: string) => `/companies/${subdomain}/clients`;

/** The company's customers. */
export const customersApi = {
	list: (subdomain: string, params: CustomerListParams) =>
		send<PaginatedData<CustomerRow>>(
			axios.get(base(subdomain), { params: toQuery(params) })
		),
	get: (subdomain: string, id: string) =>
		send<CustomerDetail>(axios.get(`${base(subdomain)}/${id}`)),
	create: (subdomain: string, values: z.input<typeof createClientSchema>) =>
		send<CustomerRow>(axios.post(base(subdomain), values)),
	update: (
		subdomain: string,
		id: string,
		values: z.input<typeof patchClientSchema>
	) => send<CustomerRow>(axios.patch(`${base(subdomain)}/${id}`, values)),
	remove: (subdomain: string, id: string) =>
		send<null>(axios.delete(`${base(subdomain)}/${id}`)),
};
