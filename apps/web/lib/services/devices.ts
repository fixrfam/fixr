import type {
	createDeviceSchema,
	deviceStatuses,
	patchDeviceSchema,
} from "@fixr/schemas/devices";
import type { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import type { ApiResponse, PaginatedData } from "@fixr/schemas/utils";
import type { z } from "zod";
import { axios } from "../auth/axios";

export type DeviceStatus = z.infer<typeof deviceStatuses>;

interface Relation {
	id: string;
	name: string;
}

/** A customer's device with its owner and catalog model. */
export interface DeviceRow {
	id: string;
	clientId: string;
	modelId: string;
	imei: string | null;
	serialNumber: string | null;
	notes: string | null;
	status: DeviceStatus;
	createdAt: string;
	updatedAt: string;
	client: Relation & { cpf: string; phone: string | null };
	model: Relation & { slug: string };
	maker: Relation;
	category: Relation | null;
}

export interface DeviceDetail extends DeviceRow {
	serviceOrders: {
		id: string;
		status: z.infer<typeof serviceOrderStatuses>;
		reportedDefect: string;
		createdAt: string;
	}[];
}

export interface DeviceListParams {
	page: number;
	perPage: number;
	query?: string;
	clientId?: string;
	status?: DeviceStatus;
	sort?: "newer" | "older" | "updated";
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

const base = (subdomain: string) => `/companies/${subdomain}/devices`;

/** The customers' devices. */
export const devicesApi = {
	list: (subdomain: string, params: DeviceListParams) =>
		send<PaginatedData<DeviceRow>>(
			axios.get(base(subdomain), { params: toQuery(params) })
		),
	get: (subdomain: string, id: string) =>
		send<DeviceDetail>(axios.get(`${base(subdomain)}/${id}`)),
	create: (subdomain: string, values: z.input<typeof createDeviceSchema>) =>
		send<DeviceRow>(axios.post(base(subdomain), values)),
	update: (
		subdomain: string,
		id: string,
		values: z.input<typeof patchDeviceSchema>
	) => send<DeviceRow>(axios.patch(`${base(subdomain)}/${id}`, values)),
	remove: (subdomain: string, id: string) =>
		send<null>(axios.delete(`${base(subdomain)}/${id}`)),
};
