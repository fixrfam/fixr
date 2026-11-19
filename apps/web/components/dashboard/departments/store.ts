"use client";

import { permissions } from "@fixr/permissions";
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useSubdomain } from "@/components/dashboard/customers/store";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import {
	type DepartmentDetail,
	type DepartmentListParams,
	departmentsApi,
	employeeOptionsApi,
} from "@/lib/services/departments";

export const departmentKeys = {
	all: (subdomain: string) => ["departments", subdomain] as const,
	list: (subdomain: string, params: DepartmentListParams) =>
		["departments", subdomain, "list", params] as const,
	detail: (subdomain: string, id: string) =>
		["departments", subdomain, "detail", id] as const,
	stageOwners: (subdomain: string) =>
		["departments", subdomain, "stage-owners"] as const,
};

/** How many departments a picker or filter loads (a shop has a handful). */
export const DEPARTMENT_OPTIONS_SIZE = 100;

export function useDepartmentsPage(params: DepartmentListParams) {
	const subdomain = useSubdomain();
	return useQuery({
		queryKey: departmentKeys.list(subdomain, params),
		queryFn: () => departmentsApi.list(subdomain, params),
		placeholderData: keepPreviousData,
	});
}

/** Every department, by name, for selects and filters. */
export function useDepartmentOptions() {
	const query = useDepartmentsPage({
		page: 1,
		perPage: DEPARTMENT_OPTIONS_SIZE,
		sort: "name",
	});
	return { ...query, data: query.data?.records ?? [] };
}

export function useDepartment(id: string) {
	const subdomain = useSubdomain();
	return useQuery({
		queryKey: departmentKeys.detail(subdomain, id),
		queryFn: () => departmentsApi.get(subdomain, id),
		// Stages without a department ask for "": there's nothing to load.
		enabled: Boolean(id),
	});
}

export function useStageOwners() {
	const subdomain = useSubdomain();
	return useQuery({
		queryKey: departmentKeys.stageOwners(subdomain),
		queryFn: () => departmentsApi.stageOwners(subdomain),
	});
}

/** Employees matching a name or CPF; nothing without `employees:read`. */
export function useEmployeeSearch(search: string) {
	const subdomain = useSubdomain();
	const canRead = useCatalogAbility().can(permissions.employees.read);
	const query = useQuery({
		queryKey: ["employees", subdomain, "search", search.trim()],
		queryFn: () => employeeOptionsApi.search(subdomain, search.trim()),
		placeholderData: keepPreviousData,
		enabled: canRead,
	});
	return { employees: query.data ?? [], loading: query.isFetching };
}

/**
 * Departments show up in orders (their department), pools and the employees
 * list, so a change refreshes all of them.
 */
function useInvalidateDepartments() {
	const subdomain = useSubdomain();
	const queryClient = useQueryClient();
	return (detail?: DepartmentDetail) => {
		if (detail) {
			queryClient.setQueryData(
				departmentKeys.detail(subdomain, detail.id),
				detail
			);
		}
		return Promise.all(
			[
				departmentKeys.all(subdomain),
				["service-orders", subdomain],
				["employees", subdomain],
				["employeesData"],
			].map((queryKey) => queryClient.invalidateQueries({ queryKey }))
		);
	};
}

function useDepartmentMutation<TArgs, TResult>(
	request: (subdomain: string, args: TArgs) => Promise<TResult>
) {
	const subdomain = useSubdomain();
	const invalidate = useInvalidateDepartments();
	return useMutation({
		mutationFn: (args: TArgs) => request(subdomain, args),
		onSuccess: (result) =>
			invalidate(
				result && typeof result === "object" && "members" in result
					? (result as unknown as DepartmentDetail)
					: undefined
			),
	});
}

export const useCreateDepartment = () =>
	useDepartmentMutation((subdomain, name: string) =>
		departmentsApi.create(subdomain, { name })
	);

export const useUpdateDepartment = (id: string) =>
	useDepartmentMutation(
		(subdomain, values: { name?: string; leaderId?: string | null }) =>
			departmentsApi.update(subdomain, id, values)
	);

export const useDeleteDepartment = () =>
	useDepartmentMutation((subdomain, id: string) =>
		departmentsApi.remove(subdomain, id)
	);

export const useAddDepartmentMembers = (id: string) =>
	useDepartmentMutation((subdomain, employeeIds: string[]) =>
		departmentsApi.addMembers(subdomain, id, { employeeIds })
	);

export const useRemoveDepartmentMember = (id: string) =>
	useDepartmentMutation((subdomain, employeeId: string) =>
		departmentsApi.removeMember(subdomain, id, employeeId)
	);

export const useSetEmployeeDepartments = () =>
	useDepartmentMutation(
		(
			subdomain,
			{
				employeeId,
				departmentIds,
			}: { employeeId: string; departmentIds: string[] }
		) =>
			departmentsApi.setEmployeeDepartments(
				subdomain,
				employeeId,
				departmentIds
			)
	);

export function usePutStageOwners() {
	const subdomain = useSubdomain();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (values: Parameters<typeof departmentsApi.putStageOwners>[1]) =>
			departmentsApi.putStageOwners(subdomain, values),
		onSuccess: (owners) =>
			queryClient.setQueryData(departmentKeys.stageOwners(subdomain), owners),
	});
}
