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

/** The API caps `perPage` at 100. */
const PAGE_SIZE = 100;

/**
 * Fetch every record of a company-scoped list. The dashboard tables search,
 * filter and paginate on the client, so they need the whole catalog.
 */
async function fetchAll<T>(path: string): Promise<T[]> {
	const records: T[] = [];
	let page: number | null = 1;

	while (page) {
		const response = await axios.get<ApiResponse<PaginatedData<T>>>(path, {
			params: { page, perPage: PAGE_SIZE },
		});
		const data = response.data.data as PaginatedData<T>;
		records.push(...data.records);
		page = data.pagination.next_page;
	}

	return records;
}

async function send<T>(request: Promise<{ data: ApiResponse<T> }>) {
	const response = await request;
	return response.data.data as T;
}

export const inventoryApi = {
	listParts: (subdomain: string) =>
		fetchAll<PartRow>(`/companies/${subdomain}/parts`),
	listServices: (subdomain: string) =>
		fetchAll<ServiceRow>(`/companies/${subdomain}/services`),
	listSuppliers: (subdomain: string) =>
		fetchAll<SupplierRow>(`/companies/${subdomain}/suppliers`),

	createPart: (subdomain: string, values: z.input<typeof createPartSchema>) =>
		send<PartRow>(axios.post(`/companies/${subdomain}/parts`, values)),
	updatePart: (
		subdomain: string,
		id: string,
		values: z.input<typeof patchPartSchema>
	) =>
		send<PartRow>(axios.patch(`/companies/${subdomain}/parts/${id}`, values)),

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
