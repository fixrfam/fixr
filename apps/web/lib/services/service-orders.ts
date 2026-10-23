import type { serviceOrderItemSelectSchema } from "@fixr/db/schema";
import type {
	addServiceOrderItemSchema,
	patchServiceOrderItemSchema,
} from "@fixr/schemas/service-orders";
import type { ApiResponse } from "@fixr/schemas/utils";
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
