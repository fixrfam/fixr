"use client";

import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useParams } from "next/navigation";
import {
	type CustomerListParams,
	customersApi,
} from "@/lib/services/customers";

export const customerKeys = {
	all: (subdomain: string) => ["customers", subdomain] as const,
	list: (subdomain: string, params: CustomerListParams) =>
		["customers", subdomain, "list", params] as const,
	detail: (subdomain: string, id: string) =>
		["customers", subdomain, "detail", id] as const,
};

/** How many customers a picker loads per search. */
export const CUSTOMER_PICKER_SIZE = 20;

export function useSubdomain() {
	return useParams<{ subdomain: string }>().subdomain;
}

/** Customers, devices and service orders show each other: a change refreshes all three. */
export function useInvalidateRepairs() {
	const queryClient = useQueryClient();
	const subdomain = useSubdomain();

	return () =>
		Promise.all(
			["customers", "devices", "service-orders"].map((key) =>
				queryClient.invalidateQueries({ queryKey: [key, subdomain] })
			)
		);
}

export function useCustomersPage(params: CustomerListParams) {
	const subdomain = useSubdomain();
	return useQuery({
		queryKey: customerKeys.list(subdomain, params),
		queryFn: () => customersApi.list(subdomain, params),
		placeholderData: keepPreviousData,
	});
}

/** Customers matching a picker's search, by name first. */
export function useCustomerSearch(search: string) {
	const query = useCustomersPage({
		page: 1,
		perPage: CUSTOMER_PICKER_SIZE,
		query: search.trim(),
		sort: "name",
	});
	return { customers: query.data?.records ?? [], loading: query.isFetching };
}

export function useCustomer(id: string) {
	const subdomain = useSubdomain();
	return useQuery({
		queryKey: customerKeys.detail(subdomain, id),
		queryFn: () => customersApi.get(subdomain, id),
		enabled: Boolean(id),
	});
}

export function useCreateCustomer() {
	const subdomain = useSubdomain();
	const invalidate = useInvalidateRepairs();
	return useMutation({
		mutationFn: (values: Parameters<typeof customersApi.create>[1]) =>
			customersApi.create(subdomain, values),
		onSuccess: invalidate,
	});
}

export function useUpdateCustomer(id: string) {
	const subdomain = useSubdomain();
	const invalidate = useInvalidateRepairs();
	return useMutation({
		mutationFn: (values: Parameters<typeof customersApi.update>[2]) =>
			customersApi.update(subdomain, id, values),
		onSuccess: invalidate,
	});
}

export function useDeleteCustomer() {
	const subdomain = useSubdomain();
	const invalidate = useInvalidateRepairs();
	return useMutation({
		mutationFn: (id: string) => customersApi.remove(subdomain, id),
		onSuccess: invalidate,
	});
}
