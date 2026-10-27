import { HttpResponse, http } from "msw";
import type { CustomerRow } from "@/lib/services/customers";
import type { DeviceRow } from "@/lib/services/devices";
import type { ServiceOrderDetail } from "@/lib/services/service-orders";
import { apiUrl, envelope } from "./handlers";
import { server } from "./server";

const NOW = "2026-10-20T12:00:00.000Z";

export const customer: CustomerRow = {
	id: "ccustomer0000000000000001",
	name: "Maria Cliente",
	cpf: "52998224725",
	email: "maria@cliente.test",
	phone: "11998765432",
	alternativePhone: null,
	address: "Rua A, 1",
	city: "São Paulo",
	state: "SP",
	createdAt: NOW,
};

export const device: DeviceRow = {
	id: "cdevice000000000000000001",
	clientId: customer.id,
	modelId: "cmodel0000000000000000001",
	imei: "356938035643809",
	serialNumber: null,
	notes: null,
	status: "with_customer",
	createdAt: NOW,
	updatedAt: NOW,
	client: {
		id: customer.id,
		name: customer.name,
		cpf: customer.cpf,
		phone: customer.phone,
	},
	model: {
		id: "cmodel0000000000000000001",
		name: "Apple iPhone 13",
		slug: "apple-iphone-13",
		imageUrl: null,
	},
	maker: { id: "cmaker0000000000000000001", name: "Apple" },
	category: {
		id: "ccategory0000000000000001",
		name: "Smartphone",
		slug: "smartphones",
	},
};

export const serviceOrder: ServiceOrderDetail = {
	id: "cserviceorder00000000abc1",
	number: 12,
	clientId: customer.id,
	employeeId: "cemployee0000000000000001",
	deviceId: device.id,
	reportedDefect: "Tela quebrada",
	observations: "Sem carregador",
	status: "fixing",
	createdAt: NOW,
	updatedAt: NOW,
	client: {
		id: customer.id,
		name: customer.name,
		cpf: customer.cpf,
		phone: customer.phone,
		email: customer.email,
	},
	employee: { id: "cemployee0000000000000001", name: "Téo Técnico" },
	device: {
		id: device.id,
		imei: device.imei,
		serialNumber: null,
		status: "in_shop",
	},
	model: device.model,
	deviceMaker: device.maker,
	deviceCategory: device.category,
	photos: [],
	history: [
		{
			id: "chistory00000000000000001",
			from: null,
			to: "pending",
			note: null,
			createdAt: NOW,
			employee: { id: "cemployee0000000000000001", name: "Téo Técnico" },
		},
		{
			id: "chistory00000000000000002",
			from: "pending",
			to: "fixing",
			note: "Troca da tela iniciada",
			createdAt: NOW,
			employee: { id: "cemployee0000000000000001", name: "Téo Técnico" },
		},
	],
};

const modelListItem = {
	id: device.model.id,
	name: device.model.name,
	slug: device.model.slug,
	imageUrl: null,
	maker: { id: device.maker.id, name: "Apple", slug: "apple" },
	category: null,
	isCustom: false,
};

function page<T>(records: T[]) {
	return HttpResponse.json(
		envelope({
			records,
			pagination: {
				total_records: records.length,
				total_pages: records.length ? 1 : 0,
				current_page: 1,
				next_page: null,
				prev_page: null,
			},
		})
	);
}

/**
 * Serve one customer, their device, one service order and the model catalog
 * of the `fixr` company, and record every write and list query.
 */
export function serveRepairs() {
	const writes: { method: string; path: string; body: unknown }[] = [];
	const listQueries: { path: string; params: Record<string, string> }[] = [];
	const base = "/companies/fixr";

	async function record(request: Request) {
		const body = request.method === "DELETE" ? null : await request.json();
		writes.push({
			method: request.method,
			path: new URL(request.url).pathname,
			body,
		});
		return body as Record<string, unknown>;
	}

	function listed(request: Request) {
		const url = new URL(request.url);
		listQueries.push({
			path: url.pathname,
			params: Object.fromEntries(url.searchParams),
		});
	}

	server.use(
		http.get(apiUrl(`${base}/clients`), ({ request }) => {
			listed(request);
			return page([customer]);
		}),
		http.get(apiUrl(`${base}/clients/:id`), () =>
			HttpResponse.json(
				envelope({
					...customer,
					serviceOrders: [
						{
							id: serviceOrder.id,
							number: serviceOrder.number,
							deviceId: device.id,
							deviceModel: device.model.name,
							status: serviceOrder.status,
							createdAt: NOW,
						},
					],
				})
			)
		),
		http.post(apiUrl(`${base}/clients`), async ({ request }) => {
			const body = await record(request);
			return HttpResponse.json(envelope({ ...customer, ...body }), {
				status: 201,
			});
		}),
		http.patch(apiUrl(`${base}/clients/:id`), async ({ request }) => {
			const body = await record(request);
			return HttpResponse.json(envelope({ ...customer, ...body }));
		}),
		http.get(apiUrl(`${base}/devices`), ({ request }) => {
			listed(request);
			return page([device]);
		}),
		http.get(apiUrl(`${base}/devices/:id`), () =>
			HttpResponse.json(envelope({ ...device, serviceOrders: [] }))
		),
		http.post(apiUrl(`${base}/devices`), async ({ request }) => {
			const body = await record(request);
			return HttpResponse.json(envelope({ ...device, ...body }), {
				status: 201,
			});
		}),
		http.patch(apiUrl(`${base}/devices/:id`), async ({ request }) => {
			const body = await record(request);
			return HttpResponse.json(envelope({ ...device, ...body }));
		}),
		http.delete(apiUrl(`${base}/devices/:id`), async ({ request }) => {
			await record(request);
			return HttpResponse.json(envelope(null));
		}),
		http.get(apiUrl(`${base}/models`), ({ request }) => {
			listed(request);
			return page([modelListItem]);
		}),
		http.get(apiUrl(`${base}/service-orders`), ({ request }) => {
			listed(request);
			return page([serviceOrder]);
		}),
		http.get(apiUrl(`${base}/service-orders/:id`), () =>
			HttpResponse.json(envelope(serviceOrder))
		),
		http.post(apiUrl(`${base}/service-orders`), async ({ request }) => {
			await record(request);
			return HttpResponse.json(
				envelope({ id: serviceOrder.id, number: serviceOrder.number }),
				{ status: 201 }
			);
		}),
		http.post(
			apiUrl(`${base}/service-orders/:id/photos`),
			async ({ request }) => {
				await record(request);
				return HttpResponse.json(envelope(serviceOrder), { status: 201 });
			}
		),
		http.delete(
			apiUrl(`${base}/service-orders/:id/photos/:photoId`),
			async ({ request }) => {
				await record(request);
				return HttpResponse.json(envelope(serviceOrder));
			}
		),
		http.post(apiUrl(`${base}/models`), async ({ request }) => {
			const body = await record(request);
			return HttpResponse.json(
				envelope({ id: "cmodel0000000000000000099", slug: "new", ...body }),
				{ status: 201 }
			);
		}),
		http.get(apiUrl(`${base}/makers`), () =>
			page([
				{ id: device.maker.id, name: "Apple", slug: "apple", deviceCount: 1 },
			])
		),
		http.get(apiUrl(`${base}/categories`), () =>
			HttpResponse.json(envelope([device.category]))
		),
		http.patch(
			apiUrl(`${base}/service-orders/:id/status`),
			async ({ request }) => {
				const body = await record(request);
				return HttpResponse.json(envelope({ ...serviceOrder, ...body }));
			}
		),
		http.patch(apiUrl(`${base}/service-orders/:id`), async ({ request }) => {
			const body = await record(request);
			return HttpResponse.json(envelope({ ...serviceOrder, ...body }));
		})
	);

	return { writes, listQueries };
}
