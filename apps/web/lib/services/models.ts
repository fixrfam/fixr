import type {
	createModelBodySchema,
	ModelDetail,
	ModelListItem,
} from "@fixr/schemas/models";
import type { ApiResponse, PaginatedData } from "@fixr/schemas/utils";
import type { z } from "zod";
import { axios } from "../auth/axios";

export type ModelSort = "newer" | "older" | "name";

export interface ModelListParams {
	page: number;
	perPage: number;
	/** Every word must appear in the name, brand, model numbers, chipset or CPU. */
	query?: string;
	categoryId?: string;
	makerId?: string;
	sort?: ModelSort;
}

export interface ModelCategory {
	id: string;
	name: string;
	slug: string;
}

export interface ModelMaker {
	id: string;
	name: string;
	slug: string;
	deviceCount: number;
}

export interface MakerListParams {
	page: number;
	perPage: number;
	query?: string;
	sort?: "name" | "most_devices";
}

/** Drops empty values so they never reach the query string. */
function toQuery(params: object) {
	return Object.fromEntries(
		Object.entries(params).filter(
			([, value]) => value !== undefined && value !== null && value !== ""
		)
	);
}

async function get<T>(path: string, params?: object) {
	const response = await axios.get<ApiResponse<T>>(path, {
		params: params && toQuery(params),
	});
	return response.data.data as T;
}

/** The device catalog: models shared by every company plus the company's own. */
export const modelsApi = {
	list: (subdomain: string, params: ModelListParams) =>
		get<PaginatedData<ModelListItem>>(`/companies/${subdomain}/models`, params),
	get: (subdomain: string, slug: string) =>
		get<ModelDetail>(
			`/companies/${subdomain}/models/${encodeURIComponent(slug)}`
		),
	listCategories: (subdomain: string) =>
		get<ModelCategory[]>(`/companies/${subdomain}/categories`),
	listMakers: (subdomain: string, params: MakerListParams) =>
		get<PaginatedData<ModelMaker>>(`/companies/${subdomain}/makers`, params),
	/** Adds a model of the company's own (shared catalog models are read-only). */
	create: async (
		subdomain: string,
		values: z.input<typeof createModelBodySchema>
	) => {
		const response = await axios.post<
			ApiResponse<{ id: string; name: string; slug: string }>
		>(`/companies/${subdomain}/models`, values);
		return response.data.data as { id: string; name: string; slug: string };
	},
};
