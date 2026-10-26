import type { createPartSchema, patchPartSchema } from "@fixr/schemas/parts";
import type {
	createServiceSchema,
	patchServiceSchema,
} from "@fixr/schemas/services";
import type { createSupplierSchema } from "@fixr/schemas/suppliers";
import type { ApiResponse, PaginatedData } from "@fixr/schemas/utils";
import type { z } from "zod";
import { axios } from "../auth/axios";

/** Fields of a part the dashboard works with (the API also sends ids and timestamps). */
export interface PartRow {
	id: string;
	sku: string;
	name: string;
	description?: string | null;
	category: string;
	costPrice: number;
	salePrice: number;
	stock: number;
	minStock: number;
	supplierId: string;
	/** Summary the API embeds, so the supplier shows even without `suppliers:read`. */
	supplier?: { id: string; name: string };
}

export interface ServiceRow {
	id: string;
	name: string;
	description: string;
	estimatedDurationMinutes: number;
	price: number;
	partIds: string[];
	deviceCategories: string[];
	testInstructions: string[];
	testParameters: string[];
}

export interface SupplierRow {
	id: string;
	name: string;
	/** Digits only. */
	cnpj: string;
	contact: string;
	/** Digits only for records created through the API. */
	phone: string;
	email: string;
}

/** Sort orders every catalog list accepts. */
export type CatalogSort = "name" | "newer" | "older";

interface ListParams {
	page: number;
	perPage: number;
	/** Free text search; each list decides which fields it matches. */
	query?: string;
	sort?: CatalogSort;
}

export interface PartListParams extends ListParams {
	category?: string;
	supplierId?: string;
	/** Only parts at or below their minimum stock (out of stock included). */
	lowStock?: boolean;
}

export interface ServiceListParams extends ListParams {
	deviceCategory?: string;
}

export type SupplierListParams = ListParams;

/** Drops empty values so they never reach the query string. */
function toQuery(params: object) {
	return Object.fromEntries(
		Object.entries(params)
			.filter(
				([, value]) => value !== undefined && value !== "" && value !== false
			)
			.map(([key, value]) => [key, String(value)])
	);
}

const CNPJ_LIKE = /^[\d./\s-]+$/;
const NON_DIGITS = /\D/g;

/** CNPJs are stored as digits, so a typed "12.345.678/" searches "12345678". */
function toCnpjSearch(query: string) {
	return CNPJ_LIKE.test(query) ? query.replace(NON_DIGITS, "") : query;
}

async function fetchPage<T>(path: string, params: object) {
	const response = await axios.get<ApiResponse<PaginatedData<T>>>(path, {
		params: toQuery(params),
	});
	return response.data.data as PaginatedData<T>;
}

async function send<T>(request: Promise<{ data: ApiResponse<T> }>) {
	const response = await request;
	return response.data.data as T;
}

/**
 * The catalog API. Lists are paginated, searched, filtered and sorted by the
 * server; the dashboard only asks for the page it shows.
 */
export const inventoryApi = {
	listParts: (subdomain: string, params: PartListParams) =>
		fetchPage<PartRow>(`/companies/${subdomain}/parts`, params),
	listServices: (subdomain: string, params: ServiceListParams) =>
		fetchPage<ServiceRow>(`/companies/${subdomain}/services`, params),
	listSuppliers: (subdomain: string, params: SupplierListParams) =>
		fetchPage<SupplierRow>(`/companies/${subdomain}/suppliers`, {
			...params,
			query: params.query && toCnpjSearch(params.query),
		}),

	getPart: (subdomain: string, id: string) =>
		send<PartRow>(axios.get(`/companies/${subdomain}/parts/${id}`)),
	getService: (subdomain: string, id: string) =>
		send<ServiceRow>(axios.get(`/companies/${subdomain}/services/${id}`)),

	createPart: (subdomain: string, values: z.input<typeof createPartSchema>) =>
		send<PartRow>(axios.post(`/companies/${subdomain}/parts`, values)),
	updatePart: (
		subdomain: string,
		id: string,
		values: z.input<typeof patchPartSchema>
	) =>
		send<PartRow>(axios.patch(`/companies/${subdomain}/parts/${id}`, values)),
	/** Add `delta` units to the stock (negative removes). */
	adjustPartStock: (subdomain: string, id: string, delta: number) =>
		send<PartRow>(
			axios.post(`/companies/${subdomain}/parts/${id}/stock-adjustments`, {
				delta,
			})
		),

	createService: (
		subdomain: string,
		values: z.input<typeof createServiceSchema>
	) => send<ServiceRow>(axios.post(`/companies/${subdomain}/services`, values)),
	updateService: (
		subdomain: string,
		id: string,
		values: z.input<typeof patchServiceSchema>
	) =>
		send<ServiceRow>(
			axios.patch(`/companies/${subdomain}/services/${id}`, values)
		),

	createSupplier: (
		subdomain: string,
		values: z.input<typeof createSupplierSchema>
	) =>
		send<SupplierRow>(axios.post(`/companies/${subdomain}/suppliers`, values)),
};
