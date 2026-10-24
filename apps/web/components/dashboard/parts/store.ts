"use client";

import { createAbility, permissions } from "@fixr/permissions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useSession } from "@/lib/hooks/use-session";
import { inventoryApi } from "@/lib/services/inventory";
import {
	buildPartRows,
	buildServiceRows,
	buildSupplierRows,
	type PartsData,
} from "./table/data";

/** Query keys of the company catalog; every mutation refreshes the whole catalog. */
export const inventoryKeys = {
	all: (subdomain: string) => ["inventory", subdomain] as const,
	parts: (subdomain: string) => ["inventory", subdomain, "parts"] as const,
	services: (subdomain: string) =>
		["inventory", subdomain, "services"] as const,
	suppliers: (subdomain: string) =>
		["inventory", subdomain, "suppliers"] as const,
};

function useSubdomain() {
	return useParams<{ subdomain: string }>().subdomain;
}

/** The caller's ability, from the session role (same approach as the sidebar). */
export function useCatalogAbility() {
	const { session } = useSession();
	return createAbility(session?.company?.role ?? "guest");
}

/**
 * The company's parts, services and suppliers, loaded from the API. The
 * tables link the three lists together, so they are always loaded together.
 */
export function useInventory(): PartsData & { isPending: boolean } {
	const subdomain = useSubdomain();
	// Technicians read the catalog without suppliers; parts embed the supplier name.
	const canReadSuppliers = useCatalogAbility().can(permissions.suppliers.read);
	const parts = useQuery({
		queryKey: inventoryKeys.parts(subdomain),
		queryFn: () => inventoryApi.listParts(subdomain),
	});
	const services = useQuery({
		queryKey: inventoryKeys.services(subdomain),
		queryFn: () => inventoryApi.listServices(subdomain),
	});
	const suppliers = useQuery({
		queryKey: inventoryKeys.suppliers(subdomain),
		queryFn: () => inventoryApi.listSuppliers(subdomain),
		enabled: canReadSuppliers,
	});

	return useMemo(
		() => ({
			parts: parts.data ?? [],
			services: services.data ?? [],
			suppliers: suppliers.data ?? [],
			isPending:
				parts.isPending ||
				services.isPending ||
				(canReadSuppliers && suppliers.isPending),
		}),
		[
			parts.data,
			services.data,
			suppliers.data,
			parts.isPending,
			services.isPending,
			suppliers.isPending,
			canReadSuppliers,
		]
	);
}

export function usePartRows() {
	const data = useInventory();
	return useMemo(() => buildPartRows(data), [data]);
}

export function useServiceRows() {
	const data = useInventory();
	return useMemo(() => buildServiceRows(data), [data]);
}

export function useSupplierRows() {
	const data = useInventory();
	return useMemo(() => buildSupplierRows(data), [data]);
}

export function useServiceRow(id: string) {
	const rows = useServiceRows();
	return useMemo(() => rows.find((row) => row.id === id) ?? null, [rows, id]);
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
