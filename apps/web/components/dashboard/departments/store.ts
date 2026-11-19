"use client";

import { permissions } from "@fixr/permissions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSubdomain } from "@/components/dashboard/customers/store";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import {
	employeeOptionsApi,
	type Sector,
	sectorsApi,
} from "@/lib/services/sectors";

export const sectorKeys = {
	list: (subdomain: string) => ["sectors", subdomain, "list"] as const,
	stageOwners: (subdomain: string) =>
		["sectors", subdomain, "stage-owners"] as const,
	employees: (subdomain: string) =>
		["sectors", subdomain, "employees"] as const,
};

export function useSectors() {
	const subdomain = useSubdomain();
	return useQuery({
		queryKey: sectorKeys.list(subdomain),
		queryFn: () => sectorsApi.list(subdomain),
	});
}

export function useStageOwners() {
	const subdomain = useSubdomain();
	return useQuery({
		queryKey: sectorKeys.stageOwners(subdomain),
		queryFn: () => sectorsApi.stageOwners(subdomain),
	});
}

/** Every employee of the company, for pickers; empty without `employees:read`. */
export function useEmployeeOptions() {
	const subdomain = useSubdomain();
	const canRead = useCatalogAbility().can(permissions.employees.read);
	return useQuery({
		queryKey: sectorKeys.employees(subdomain),
		queryFn: () => employeeOptionsApi.list(subdomain),
		enabled: canRead,
	});
}

/**
 * A change to the sectors answers with the whole list. Orders show their
 * sector, and the "my sector" pool depends on it, so they refresh too.
 */
function useSectorsMutation<TArgs>(
	request: (subdomain: string, args: TArgs) => Promise<Sector[]>
) {
	const subdomain = useSubdomain();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (args: TArgs) => request(subdomain, args),
		onSuccess: (sectors) => {
			queryClient.setQueryData(sectorKeys.list(subdomain), sectors);
			return Promise.all([
				queryClient.invalidateQueries({
					queryKey: sectorKeys.employees(subdomain),
				}),
				queryClient.invalidateQueries({
					queryKey: ["service-orders", subdomain],
				}),
			]);
		},
	});
}

export const useCreateSector = () =>
	useSectorsMutation((subdomain, name: string) =>
		sectorsApi.create(subdomain, { name })
	);

export const useRenameSector = () =>
	useSectorsMutation((subdomain, { id, name }: { id: string; name: string }) =>
		sectorsApi.rename(subdomain, id, { name })
	);

export const useDeleteSector = () =>
	useSectorsMutation((subdomain, id: string) =>
		sectorsApi.remove(subdomain, id)
	);

export const useSetEmployeeSector = () =>
	useSectorsMutation(
		(
			subdomain,
			{ employeeId, sectorId }: { employeeId: string; sectorId: string | null }
		) => sectorsApi.setEmployeeSector(subdomain, employeeId, sectorId)
	);

export function usePutStageOwners() {
	const subdomain = useSubdomain();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (values: Parameters<typeof sectorsApi.putStageOwners>[1]) =>
			sectorsApi.putStageOwners(subdomain, values),
		onSuccess: (owners) =>
			queryClient.setQueryData(sectorKeys.stageOwners(subdomain), owners),
	});
}
