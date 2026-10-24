"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import {
	type MakerListParams,
	type ModelListParams,
	modelsApi,
} from "@/lib/services/models";

/** Makers a filter loads per search. */
export const MAKERS_PAGE_SIZE = 30;

export const modelKeys = {
	all: (subdomain: string) => ["models", subdomain] as const,
	list: (subdomain: string, params: ModelListParams) =>
		["models", subdomain, "list", params] as const,
	detail: (subdomain: string, slug: string) =>
		["models", subdomain, "detail", slug] as const,
	categories: (subdomain: string) =>
		["models", subdomain, "categories"] as const,
	makers: (subdomain: string, params: MakerListParams) =>
		["models", subdomain, "makers", params] as const,
};

function useSubdomain() {
	return useParams<{ subdomain: string }>().subdomain;
}

/** One page of models. The previous page stays on screen while the next loads. */
export function useModelsPage(params: ModelListParams) {
	const subdomain = useSubdomain();
	return useQuery({
		queryKey: modelKeys.list(subdomain, params),
		queryFn: () => modelsApi.list(subdomain, params),
		placeholderData: keepPreviousData,
	});
}

export function useModel(slug: string) {
	const subdomain = useSubdomain();
	return useQuery({
		queryKey: modelKeys.detail(subdomain, slug),
		queryFn: () => modelsApi.get(subdomain, slug),
	});
}

/** Categories rarely change, so they stay cached for the session. */
export function useModelCategories() {
	const subdomain = useSubdomain();
	return useQuery({
		queryKey: modelKeys.categories(subdomain),
		queryFn: () => modelsApi.listCategories(subdomain),
		staleTime: Number.POSITIVE_INFINITY,
	});
}

/** Makers matching a search, the ones with the most models first. */
export function useMakers(query: string) {
	const subdomain = useSubdomain();
	const params: MakerListParams = {
		page: 1,
		perPage: MAKERS_PAGE_SIZE,
		query,
		sort: "most_devices",
	};
	return useQuery({
		queryKey: modelKeys.makers(subdomain, params),
		queryFn: () => modelsApi.listMakers(subdomain, params),
		placeholderData: keepPreviousData,
		staleTime: 5 * 60 * 1000,
	});
}
