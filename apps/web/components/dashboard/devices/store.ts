"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
	useInvalidateRepairs,
	useSubdomain,
} from "@/components/dashboard/customers/store";
import { type DeviceListParams, devicesApi } from "@/lib/services/devices";

export const deviceKeys = {
	list: (subdomain: string, params: DeviceListParams) =>
		["devices", subdomain, "list", params] as const,
	detail: (subdomain: string, id: string) =>
		["devices", subdomain, "detail", id] as const,
};

/** How many devices a picker loads at once (a customer rarely has more). */
export const DEVICE_PICKER_SIZE = 50;

export function useDevicesPage(
	params: DeviceListParams,
	{ enabled = true }: { enabled?: boolean } = {}
) {
	const subdomain = useSubdomain();
	return useQuery({
		queryKey: deviceKeys.list(subdomain, params),
		queryFn: () => devicesApi.list(subdomain, params),
		placeholderData: keepPreviousData,
		enabled,
	});
}

/** The devices of one customer, most recently used first. */
export function useCustomerDevices(customerId: string | undefined) {
	const query = useDevicesPage(
		{
			page: 1,
			perPage: DEVICE_PICKER_SIZE,
			customerId,
			sort: "updated",
		},
		{ enabled: Boolean(customerId) }
	);
	return {
		devices: customerId ? (query.data?.records ?? []) : [],
		loading: query.isFetching,
	};
}

export function useCreateDevice() {
	const subdomain = useSubdomain();
	const invalidate = useInvalidateRepairs();
	return useMutation({
		mutationFn: (values: Parameters<typeof devicesApi.create>[1]) =>
			devicesApi.create(subdomain, values),
		onSuccess: invalidate,
	});
}

export function useUpdateDevice() {
	const subdomain = useSubdomain();
	const invalidate = useInvalidateRepairs();
	return useMutation({
		mutationFn: ({
			id,
			values,
		}: {
			id: string;
			values: Parameters<typeof devicesApi.update>[2];
		}) => devicesApi.update(subdomain, id, values),
		onSuccess: invalidate,
	});
}

export function useDeleteDevice() {
	const subdomain = useSubdomain();
	const invalidate = useInvalidateRepairs();
	return useMutation({
		mutationFn: (id: string) => devicesApi.remove(subdomain, id),
		onSuccess: invalidate,
	});
}

export function useDevice(id: string | null | undefined) {
	const subdomain = useSubdomain();
	return useQuery({
		queryKey: deviceKeys.detail(subdomain, id ?? ""),
		queryFn: () => devicesApi.get(subdomain, id as string),
		enabled: Boolean(id),
	});
}
