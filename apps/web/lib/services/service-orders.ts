import type { serviceOrderItemSelectSchema } from "@fixr/db/schema";
import type { deviceStatuses } from "@fixr/schemas/devices";
import type {
	addServiceOrderItemSchema,
	createServiceOrderSchema,
	patchServiceOrderItemSchema,
	patchServiceOrderSchema,
	serviceOrderStatuses,
} from "@fixr/schemas/service-orders";
import type { ApiResponse, PaginatedData } from "@fixr/schemas/utils";
import type { z } from "zod";
import { axios } from "../auth/axios";

export type ServiceOrderItem = z.infer<typeof serviceOrderItemSelectSchema> & {
	total: number;
};

export interface ServiceOrderItems {
	items: ServiceOrderItem[];
	totals: { parts: number; services: number; total: number };
}

const itemsUrl = (subdomain: string, serviceOrderId: string) =>
	`/companies/${subdomain}/service-orders/${serviceOrderId}/items`;

async function items(
	request: Promise<{ data: ApiResponse<ServiceOrderItems> }>
) {
	const response = await request;
	return response.data.data as ServiceOrderItems;
}

export const serviceOrderItemsApi = {
	list: (subdomain: string, serviceOrderId: string) =>
		items(axios.get(itemsUrl(subdomain, serviceOrderId))),
	add: (
		subdomain: string,
		serviceOrderId: string,
		values: z.input<typeof addServiceOrderItemSchema>
	) => items(axios.post(itemsUrl(subdomain, serviceOrderId), values)),
	update: (
		subdomain: string,
		serviceOrderId: string,
		itemId: string,
		values: z.input<typeof patchServiceOrderItemSchema>
	) =>
		items(
			axios.patch(`${itemsUrl(subdomain, serviceOrderId)}/${itemId}`, values)
		),
	remove: (subdomain: string, serviceOrderId: string, itemId: string) =>
		items(axios.delete(`${itemsUrl(subdomain, serviceOrderId)}/${itemId}`)),
};

export type ServiceOrderStatus = z.infer<typeof serviceOrderStatuses>;

interface Relation {
	id: string;
	name: string;
}

/** A service order with its customer, technician and device, as lists show it. */
export interface ServiceOrderRow {
	id: string;
	clientId: string;
	employeeId: string;
	deviceId: string;
	reportedDefect: string;
	observations: string | null;
	status: ServiceOrderStatus;
	createdAt: string;
	updatedAt: string;
	client: Relation & {
		cpf: string;
		phone: string | null;
		email: string | null;
	};
	employee: Relation;
	device: {
		id: string;
		imei: string | null;
		serialNumber: string | null;
		status: z.infer<typeof deviceStatuses>;
	};
	model: Relation & { slug: string };
	deviceMaker: Relation;
	deviceCategory: Relation | null;
}

export interface ServiceOrderPhoto {
	id: string;
	imageUrl: string;
	fileName: string;
	description: string | null;
}

export interface ServiceOrderDetail extends ServiceOrderRow {
	photos: ServiceOrderPhoto[];
}

export interface ServiceOrderListParams {
	page: number;
	perPage: number;
	query?: string;
	status?: ServiceOrderStatus;
	sort?: "newer" | "older";
}

/** Drops empty values so they never reach the query string. */
function toQuery(params: object) {
	return Object.fromEntries(
		Object.entries(params).filter(
			([, value]) => value !== undefined && value !== null && value !== ""
		)
	);
}

async function send<T>(request: Promise<{ data: ApiResponse<T> }>) {
	const response = await request;
	return response.data.data as T;
}

const ordersUrl = (subdomain: string) =>
	`/companies/${subdomain}/service-orders`;

export const serviceOrdersApi = {
	list: (subdomain: string, params: ServiceOrderListParams) =>
		send<PaginatedData<ServiceOrderRow>>(
			axios.get(ordersUrl(subdomain), { params: toQuery(params) })
		),
	get: (subdomain: string, id: string) =>
		send<ServiceOrderDetail>(axios.get(`${ordersUrl(subdomain)}/${id}`)),
	create: (
		subdomain: string,
		values: z.input<typeof createServiceOrderSchema>
	) => send<{ id: string }>(axios.post(ordersUrl(subdomain), values)),
	update: (
		subdomain: string,
		id: string,
		values: z.input<typeof patchServiceOrderSchema>
	) =>
		send<ServiceOrderDetail>(
			axios.patch(`${ordersUrl(subdomain)}/${id}`, values)
		),
	changeStatus: (subdomain: string, id: string, status: ServiceOrderStatus) =>
		send<ServiceOrderDetail>(
			axios.patch(`${ordersUrl(subdomain)}/${id}/status`, { status })
		),
};

interface PresignedUpload {
	id: string;
	uploadUrl: string;
	url: string;
}

/**
 * Upload a picture of the device straight to R2 through a presigned URL and
 * return its upload id, which the new service order then attaches.
 */
export async function uploadServiceOrderPhoto(file: File) {
	const presign = await send<PresignedUpload>(
		axios.post("/uploads/service-orders/presign", {
			fileName: file.name,
			contentType: file.type || "application/octet-stream",
			size: file.size,
		})
	);

	const upload = await fetch(presign.uploadUrl, {
		method: "PUT",
		body: file,
		headers: { "Content-Type": file.type || "application/octet-stream" },
	});
	if (!upload.ok) {
		throw new Error(`Photo upload failed with status ${upload.status}`);
	}

	return presign.id;
}
