import { mockParts, mockServices, mockSuppliers } from "@fixr/mock";
import { HttpResponse, http } from "msw";
import type {
	PartRow,
	ServiceRow,
	SupplierRow,
} from "@/lib/services/inventory";
import { apiUrl, envelope } from "./handlers";
import { server } from "./server";

interface Catalog {
	parts: PartRow[];
	services: ServiceRow[];
	suppliers: SupplierRow[];
}

/** Paginated list response, shaped like apps/server's. */
function page<T>(records: T[], request: Request) {
	const url = new URL(request.url);
	const current = Number(url.searchParams.get("page") ?? 1);
	const perPage = Number(url.searchParams.get("perPage") ?? 10);
	const slice = records.slice((current - 1) * perPage, current * perPage);
	const totalPages = Math.ceil(records.length / perPage);

	return HttpResponse.json(
		envelope({
			records: slice,
			pagination: {
				total_records: records.length,
				total_pages: totalPages,
				current_page: current,
				next_page: current < totalPages ? current + 1 : null,
				prev_page: current > 1 ? current - 1 : null,
			},
		})
	);
}

/**
 * Serve the company catalog of `subdomain` from memory (the mocks by default)
 * and record every write the dashboard sends.
 */
export function serveInventory(
	subdomain = "fixr",
	catalog: Catalog = {
		parts: [...mockParts],
		services: [...mockServices],
		suppliers: [...mockSuppliers],
	}
) {
	const writes: { method: string; path: string; body: unknown }[] = [];
	const base = `/companies/${subdomain}`;

	async function record(request: Request) {
		const body = await request.json();
		writes.push({
			method: request.method,
			path: new URL(request.url).pathname,
			body,
		});
		return body as Record<string, unknown>;
	}

	server.use(
		http.get(apiUrl(`${base}/parts`), ({ request }) =>
			page(catalog.parts, request)
		),
		http.get(apiUrl(`${base}/services`), ({ request }) =>
			page(catalog.services, request)
		),
		http.get(apiUrl(`${base}/suppliers`), ({ request }) =>
			page(catalog.suppliers, request)
		),
		http.post(apiUrl(`${base}/parts`), async ({ request }) => {
			const part = { ...(await record(request)), id: `part-${writes.length}` };
			catalog.parts.push(part as PartRow);
			return HttpResponse.json(envelope(part, { status: 201 }), {
				status: 201,
			});
		}),
		http.patch(apiUrl(`${base}/parts/:id`), async ({ request, params }) => {
			const values = await record(request);
			catalog.parts = catalog.parts.map((p) =>
				p.id === params.id ? { ...p, ...values } : p
			);
			return HttpResponse.json(envelope({ id: params.id, ...values }));
		}),
		http.post(apiUrl(`${base}/services`), async ({ request }) => {
			const service = {
				...(await record(request)),
				id: `srv-${writes.length}`,
			};
			catalog.services.push(service as ServiceRow);
			return HttpResponse.json(envelope(service, { status: 201 }), {
				status: 201,
			});
		}),
		http.patch(apiUrl(`${base}/services/:id`), async ({ request, params }) => {
			const values = await record(request);
			catalog.services = catalog.services.map((s) =>
				s.id === params.id ? { ...s, ...values } : s
			);
			return HttpResponse.json(envelope({ id: params.id, ...values }));
		}),
		http.post(apiUrl(`${base}/suppliers`), async ({ request }) => {
			const supplier = {
				...(await record(request)),
				id: `sup-${writes.length}`,
			};
			catalog.suppliers.push(supplier as SupplierRow);
			return HttpResponse.json(envelope(supplier, { status: 201 }), {
				status: 201,
			});
		})
	);

	return { catalog, writes };
}
