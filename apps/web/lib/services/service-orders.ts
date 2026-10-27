import type { serviceOrderItemSelectSchema } from "@fixr/db/schema";
import type { deviceStatuses } from "@fixr/schemas/devices";
import type {
	addServiceOrderItemSchema,
	addServiceOrderPhotosSchema,
	createServiceOrderSchema,
	patchServiceOrderItemSchema,
	patchServiceOrderSchema,
	serviceOrderStatuses,
} from "@fixr/schemas/service-orders";
import type { ApiResponse, PaginatedData } from "@fixr/schemas/utils";
import type { z } from "zod";
import { axios } from "../auth/axios";
import { shrinkImage } from "../images/shrink-image";

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
	/** Sequential per company; people see it as `<SUBDOMAIN>-<number>`. */
	number: number;
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
	model: Relation & { slug: string; imageUrl: string | null };
	deviceMaker: Relation;
	deviceCategory: (Relation & { slug: string }) | null;
}

export interface ServiceOrderPhoto {
	id: string;
	imageUrl: string;
	fileName: string;
	description: string | null;
	createdAt: string;
}

/** A status the order went through. The first entry (no `from`) is its opening. */
export interface ServiceOrderHistoryEntry {
	id: string;
	from: ServiceOrderStatus | null;
	to: ServiceOrderStatus;
	note: string | null;
	createdAt: string;
	/** Null when the system moved it (e.g. the customer approved an estimate). */
	employee: Relation | null;
}

export interface ServiceOrderDetail extends ServiceOrderRow {
	photos: ServiceOrderPhoto[];
	/** Oldest first. */
	history: ServiceOrderHistoryEntry[];
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
	) =>
		send<{ id: string; number: number }>(
			axios.post(ordersUrl(subdomain), values)
		),
	update: (
		subdomain: string,
		id: string,
		values: z.input<typeof patchServiceOrderSchema>
	) =>
		send<ServiceOrderDetail>(
			axios.patch(`${ordersUrl(subdomain)}/${id}`, values)
		),
	changeStatus: (
		subdomain: string,
		id: string,
		change: { status: ServiceOrderStatus; note?: string | null }
	) =>
		send<ServiceOrderDetail>(
			axios.patch(`${ordersUrl(subdomain)}/${id}/status`, change)
		),
	addPhotos: (
		subdomain: string,
		id: string,
		values: z.input<typeof addServiceOrderPhotosSchema>
	) =>
		send<ServiceOrderDetail>(
			axios.post(`${ordersUrl(subdomain)}/${id}/photos`, values)
		),
	deletePhoto: (subdomain: string, id: string, photoId: string) =>
		send<ServiceOrderDetail>(
			axios.delete(`${ordersUrl(subdomain)}/${id}/photos/${photoId}`)
		),
};

interface PresignedUpload {
	id: string;
	uploadUrl: string;
	url: string;
}

/**
 * Upload a picture of the device straight to R2 through a presigned URL and
 * return its upload id, which a new or open service order then attaches.
 * Photos are shrunk first: phone pictures easily pass the 10 MB limit.
 */
export async function uploadServiceOrderPhoto(original: File) {
	const file = await shrinkImage(original);
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
