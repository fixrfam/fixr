"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
	useInvalidateRepairs,
	useSubdomain,
} from "@/components/dashboard/customers/store";
import {
	type ServiceOrderListParams,
	type ServiceOrderStatus,
	serviceOrdersApi,
} from "@/lib/services/service-orders";

export const serviceOrderKeys = {
	list: (subdomain: string, params: ServiceOrderListParams) =>
		["service-orders", subdomain, "list", params] as const,
	detail: (subdomain: string, id: string) =>
		["service-orders", subdomain, "detail", id] as const,
};

export function useServiceOrdersPage(params: ServiceOrderListParams) {
	const subdomain = useSubdomain();
	return useQuery({
		queryKey: serviceOrderKeys.list(subdomain, params),
		queryFn: () => serviceOrdersApi.list(subdomain, params),
		placeholderData: keepPreviousData,
	});
}

export function useServiceOrder(id: string) {
	const subdomain = useSubdomain();
	return useQuery({
		queryKey: serviceOrderKeys.detail(subdomain, id),
		queryFn: () => serviceOrdersApi.get(subdomain, id),
	});
}

export function useCreateServiceOrder() {
	const subdomain = useSubdomain();
	const invalidate = useInvalidateRepairs();
	return useMutation({
		mutationFn: (values: Parameters<typeof serviceOrdersApi.create>[1]) =>
			serviceOrdersApi.create(subdomain, values),
		onSuccess: invalidate,
	});
}

export function useUpdateServiceOrder(id: string) {
	const subdomain = useSubdomain();
	const invalidate = useInvalidateRepairs();
	return useMutation({
		mutationFn: (values: Parameters<typeof serviceOrdersApi.update>[2]) =>
			serviceOrdersApi.update(subdomain, id, values),
		onSuccess: invalidate,
	});
}

/** Moving the order also moves its device, so devices refresh too. */
export function useChangeServiceOrderStatus(id: string) {
	const subdomain = useSubdomain();
	const invalidate = useInvalidateRepairs();
	return useMutation({
		mutationFn: (status: ServiceOrderStatus) =>
			serviceOrdersApi.changeStatus(subdomain, id, status),
		onSuccess: invalidate,
	});
}
