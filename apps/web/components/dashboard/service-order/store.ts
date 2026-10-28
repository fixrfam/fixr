"use client";

import { formatServiceOrderCode } from "@fixr/schemas/service-orders";
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	useInvalidateRepairs,
	useSubdomain,
} from "@/components/dashboard/customers/store";
import {
	type ServiceOrderListParams,
	type ServiceOrderStatus,
	serviceOrdersApi,
	uploadServiceOrderPhoto,
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
		mutationFn: (change: {
			status: ServiceOrderStatus;
			note?: string | null;
		}) => serviceOrdersApi.changeStatus(subdomain, id, change),
		onSuccess: invalidate,
	});
}

/** Upload the files to R2, then attach them to the order. */
export function useAddServiceOrderPhotos(id: string) {
	const subdomain = useSubdomain();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (files: File[]) => {
			const uploadIds = await Promise.all(files.map(uploadServiceOrderPhoto));
			return serviceOrdersApi.addPhotos(subdomain, id, {
				photos: uploadIds.map((uploadId) => ({ uploadId })),
			});
		},
		onSuccess: (order) =>
			queryClient.setQueryData(serviceOrderKeys.detail(subdomain, id), order),
	});
}

export function useDeleteServiceOrderPhoto(id: string) {
	const subdomain = useSubdomain();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (photoId: string) =>
			serviceOrdersApi.deletePhoto(subdomain, id, photoId),
		onSuccess: (order) =>
			queryClient.setQueryData(serviceOrderKeys.detail(subdomain, id), order),
	});
}

/** How people refer to an order of this company, e.g. `ACME-12`. */
export function useOrderCode() {
	const subdomain = useSubdomain();
	return (number: number) => formatServiceOrderCode(subdomain, number);
}
