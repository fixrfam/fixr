"use client";

import { createAbility, permissions } from "@fixr/permissions";
import {
	keepPreviousData,
	useMutation,
	useQueries,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useSession } from "@/lib/hooks/use-session";
import {
	inventoryApi,
	type PartListParams,
	type PartRow,
	type ServiceListParams,
	type ServiceRow,
	type SupplierListParams,
} from "@/lib/services/inventory";
import type { ServiceTableRow } from "./table/data";

/** Query keys of the company catalog; every mutation refreshes the whole catalog. */
export const inventoryKeys = {
	all: (subdomain: string) => ["inventory", subdomain] as const,
	parts: (subdomain: string, params: PartListParams) =>
		["inventory", subdomain, "parts", params] as const,
	part: (subdomain: string, id: string) =>
		["inventory", subdomain, "part", id] as const,
	services: (subdomain: string, params: ServiceListParams) =>
		["inventory", subdomain, "services", params] as const,
	service: (subdomain: string, id: string) =>
		["inventory", subdomain, "service", id] as const,
	suppliers: (subdomain: string, params: SupplierListParams) =>
		["inventory", subdomain, "suppliers", params] as const,
};

/** How many options a picker or a filter loads per search. */
export const PICKER_PAGE_SIZE = 20;

function useSubdomain() {
	return useParams<{ subdomain: string }>().subdomain;
}

/** The caller's ability, from the session role (same approach as the sidebar). */
export function useCatalogAbility() {
	const { session } = useSession();
	return createAbility(session?.company?.role ?? "guest");
}

/** One page of parts. The previous page stays on screen while the next loads. */
export function usePartsPage(params: PartListParams) {
	const subdomain = useSubdomain();
	return useQuery({
		queryKey: inventoryKeys.parts(subdomain, params),
		queryFn: () => inventoryApi.listParts(subdomain, params),
		placeholderData: keepPreviousData,
	});
}

export function useServicesPage(params: ServiceListParams) {
	const subdomain = useSubdomain();
	return useQuery({
		queryKey: inventoryKeys.services(subdomain, params),
		queryFn: () => inventoryApi.listServices(subdomain, params),
		placeholderData: keepPreviousData,
	});
}

export function useSuppliersPage(
	params: SupplierListParams,
	{ enabled = true }: { enabled?: boolean } = {}
) {
	const subdomain = useSubdomain();
	// Technicians read the catalog without suppliers; parts embed the supplier name.
	const canRead = useCatalogAbility().can(permissions.suppliers.read);
	return useQuery({
		queryKey: inventoryKeys.suppliers(subdomain, params),
		queryFn: () => inventoryApi.listSuppliers(subdomain, params),
		placeholderData: keepPreviousData,
		enabled: enabled && canRead,
	});
}

export function usePart(id: string) {
	const subdomain = useSubdomain();
	return useQuery({
		queryKey: inventoryKeys.part(subdomain, id),
		queryFn: () => inventoryApi.getPart(subdomain, id),
	});
}

export function useService(id: string) {
	const subdomain = useSubdomain();
	return useQuery({
		queryKey: inventoryKeys.service(subdomain, id),
		queryFn: () => inventoryApi.getService(subdomain, id),
	});
}

/**
 * Parts by id, for lists that only carry ids (a service's parts). Each part is
 * cached on its own, so the same part shown in several rows loads once.
 */
export function usePartsByIds(ids: string[]) {
	const subdomain = useSubdomain();
	const queries = useQueries({
		queries: ids.map((id) => ({
			queryKey: inventoryKeys.part(subdomain, id),
			queryFn: () => inventoryApi.getPart(subdomain, id),
			staleTime: 60_000,
		})),
	});

	const parts = queries
		.map((query) => query.data)
		.filter((part): part is PartRow => Boolean(part));
	const pendingIds = ids.filter((_, index) => queries[index]?.isPending);
	// The arrays change identity every render; key the memo by their content.
	const key = `${parts.map((part) => `${part.id}:${part.name}:${part.sku}`).join()}|${pendingIds.join()}`;

	// biome-ignore lint/correctness/useExhaustiveDependencies: keyed by content
	return useMemo(
		() => ({
			parts,
			/** Ids still loading. A part that failed (deleted since) is neither here nor in `parts`. */
			pendingIds: new Set(pendingIds),
			isPending: pendingIds.length > 0,
		}),
		[key]
	);
}

/**
 * Services with their parts resolved, in the order the service lists them.
 * A part still loading is left out until it arrives.
 */
export function useServicesWithParts(
	services: ServiceRow[]
): ServiceTableRow[] {
	const ids = Array.from(
		new Set(services.flatMap((service) => service.partIds))
	);
	const { parts, pendingIds } = usePartsByIds(ids);

	return useMemo(() => {
		const byId = new Map(parts.map((part) => [part.id, part]));
		return services.map((service) => ({
			...service,
			parts: service.partIds
				.map((id) => byId.get(id))
				.filter((part): part is PartRow => Boolean(part)),
			partsPending: service.partIds.some((id) => pendingIds.has(id)),
		}));
	}, [services, parts, pendingIds]);
}

/** One service with its parts, for the details and edit screens. */
export function useServiceRow(id: string) {
	const query = useService(id);
	const services = useMemo(
		() => (query.data ? [query.data] : []),
		[query.data]
	);
	const [service] = useServicesWithParts(services);

	return {
		service: service ?? null,
		// Waits for the part names too, so the details don't flash "no parts".
		isPending: query.isPending || Boolean(service?.partsPending),
	};
}

/**
 * Parts matching a picker's search, plus `remember` to keep a picked part in
 * the cache, so `usePartsByIds` has it without asking the API again.
 */
export function usePartSearch(search: string) {
	const subdomain = useSubdomain();
	const queryClient = useQueryClient();
	const query = usePartsPage({
		page: 1,
		perPage: PICKER_PAGE_SIZE,
		query: search,
		sort: "name",
	});

	return {
		parts: query.data?.records ?? [],
		loading: query.isFetching,
		remember: (part: PartRow) =>
			queryClient.setQueryData(inventoryKeys.part(subdomain, part.id), part),
	};
}

/** How many parts each supplier provides, read from the parts list total. */
export function useSupplierPartCounts(supplierIds: string[]) {
	const subdomain = useSubdomain();
	const queries = useQueries({
		queries: supplierIds.map((supplierId) => {
			const params: PartListParams = { page: 1, perPage: 1, supplierId };
			return {
				queryKey: inventoryKeys.parts(subdomain, params),
				queryFn: () => inventoryApi.listParts(subdomain, params),
				select: (data: Awaited<ReturnType<typeof inventoryApi.listParts>>) =>
					data.pagination.total_records,
			};
		}),
	});

	return new Map(
		supplierIds.map((id, index) => [id, queries[index]?.data] as const)
	);
}

function useInventoryMutation<TVariables, TResult>(
	mutationFn: (subdomain: string, variables: TVariables) => Promise<TResult>
) {
	const subdomain = useSubdomain();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (variables: TVariables) => mutationFn(subdomain, variables),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: inventoryKeys.all(subdomain) }),
	});
}

export function useCreatePart() {
	return useInventoryMutation(inventoryApi.createPart);
}

export function useUpdatePart() {
	return useInventoryMutation(
		(
			subdomain,
			{
				id,
				values,
			}: { id: string; values: Parameters<typeof inventoryApi.updatePart>[2] }
		) => inventoryApi.updatePart(subdomain, id, values)
	);
}

export function useAdjustPartStock() {
	return useInventoryMutation(
		(subdomain, { id, delta }: { id: string; delta: number }) =>
			inventoryApi.adjustPartStock(subdomain, id, delta)
	);
}

export function useCreateService() {
	return useInventoryMutation(inventoryApi.createService);
}

export function useUpdateService() {
	return useInventoryMutation(
		(
			subdomain,
			{
				id,
				values,
			}: {
				id: string;
				values: Parameters<typeof inventoryApi.updateService>[2];
			}
		) => inventoryApi.updateService(subdomain, id, values)
	);
}

export function useCreateSupplier() {
	return useInventoryMutation(inventoryApi.createSupplier);
}
