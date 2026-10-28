import { mockParts, mockServices, mockSuppliers } from "@fixr/mock";
import { HttpResponse, http } from "msw";
import type {
	PartRow,
	ServiceRow,
	SupplierRow,
} from "@/lib/services/inventory";
import { apiUrl, envelope } from "./handlers";
import { server } from "./server";

/** Services as stored: the API adds `partsPrice`/`totalPrice` when it answers. */
type StoredService = Omit<ServiceRow, "partsPrice" | "totalPrice">;

interface Catalog {
	parts: PartRow[];
	services: StoredService[];
	suppliers: SupplierRow[];
}

/** Case insensitive "contains", like the API's LIKE on a MySQL `_ci` column. */
function contains(value: string | null | undefined, query: string) {
	return (value ?? "").toLowerCase().includes(query.toLowerCase());
}

/** The API's three orders. The mocks have no timestamps: list order stands in. */
function sortRecords<T extends { name: string }>(
	records: T[],
	sort: string | null
) {
	if (sort === "name") {
		return [...records].sort((a, b) => a.name.localeCompare(b.name));
	}
	return sort === "older" ? records : [...records].reverse();
}

/** Paginated list response, shaped like apps/server's. */
function page<T>(records: T[], request: Request) {
	const url = new URL(request.url);
	const current = Number(url.searchParams.get("page") ?? 1);
	const perPage = Number(url.searchParams.get("perPage") ?? 10);
	const slice = records.slice((current - 1) * perPage, current * perPage);
	const totalPages = Math.ceil(records.length / perPage);

	if (records.length > 0 && current > totalPages) {
		return HttpResponse.json(
			{ status: 404, code: "page_out_of_bounds" },
			{ status: 404 }
		);
	}

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
/** The service priced like the API: labor plus the linked parts' sale price. */
function priced(service: StoredService, parts: PartRow[]): ServiceRow {
	const partsCents = service.partIds.reduce(
		(cents, id) =>
			cents +
			Math.round((parts.find((part) => part.id === id)?.salePrice ?? 0) * 100),
		0
	);
	return {
		...service,
		partsPrice: partsCents / 100,
		totalPrice: (Math.round(service.price * 100) + partsCents) / 100,
	};
}

export function serveInventory(
	subdomain = "fixr",
	catalog: Catalog = {
		parts: [...mockParts],
		services: [...mockServices],
		suppliers: [...mockSuppliers],
	}
) {
	const writes: { method: string; path: string; body: unknown }[] = [];
	/** Path of every list the dashboard fetched. */
	const reads: string[] = [];
	/** Query of every list request, to check what the tables ask the API for. */
	const listQueries: { path: string; params: Record<string, string> }[] = [];
	const base = `/companies/${subdomain}`;

	function list(request: Request) {
		const url = new URL(request.url);
		reads.push(url.pathname);
		listQueries.push({
			path: url.pathname,
			params: Object.fromEntries(url.searchParams),
		});
		return url.searchParams;
	}

	function withSupplier(part: PartRow): PartRow {
		const supplier = catalog.suppliers.find((s) => s.id === part.supplierId);
		return {
			...part,
			supplier:
				part.supplier ?? (supplier && { id: supplier.id, name: supplier.name }),
		};
	}

	const notFound = () =>
		HttpResponse.json({ status: 404, code: "not_found" }, { status: 404 });

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
		http.get(apiUrl(`${base}/parts`), ({ request }) => {
			const params = list(request);
			const query = params.get("query");
			const category = params.get("category");
			const supplierId = params.get("supplierId");
			const parts = catalog.parts.filter(
				(part) =>
					(!query || contains(part.name, query) || contains(part.sku, query)) &&
					(!category || part.category === category) &&
					(!supplierId || part.supplierId === supplierId) &&
					(params.get("lowStock") !== "true" || part.stock <= part.minStock)
			);
			return page(
				sortRecords(parts, params.get("sort")).map(withSupplier),
				request
			);
		}),
		http.get(apiUrl(`${base}/parts/:id`), ({ params }) => {
			const part = catalog.parts.find((p) => p.id === params.id);
			return part
				? HttpResponse.json(envelope(withSupplier(part)))
				: notFound();
		}),
		http.get(apiUrl(`${base}/services`), ({ request }) => {
			const params = list(request);
			const query = params.get("query");
			const deviceCategory = params.get("deviceCategory");
			const services = catalog.services.filter(
				(service) =>
					(!query ||
						contains(service.name, query) ||
						contains(service.description, query)) &&
					(!deviceCategory || service.deviceCategories.includes(deviceCategory))
			);
			return page(
				sortRecords(services, params.get("sort")).map((service) =>
					priced(service, catalog.parts)
				),
				request
			);
		}),
		http.get(apiUrl(`${base}/services/:id`), ({ params }) => {
			const service = catalog.services.find((s) => s.id === params.id);
			return service
				? HttpResponse.json(envelope(priced(service, catalog.parts)))
				: notFound();
		}),
		http.get(apiUrl(`${base}/suppliers`), ({ request }) => {
			const params = list(request);
			const query = params.get("query");
			const suppliers = catalog.suppliers.filter(
				(supplier) =>
					!query ||
					contains(supplier.name, query) ||
					contains(supplier.cnpj, query) ||
					contains(supplier.contact, query)
			);
			return page(sortRecords(suppliers, params.get("sort")), request);
		}),
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
		http.post(
			apiUrl(`${base}/parts/:id/stock-adjustments`),
			async ({ request, params }) => {
				const { delta } = (await record(request)) as { delta: number };
				const part = catalog.parts.find((p) => p.id === params.id);
				if (!part || part.stock + delta < 0) {
					return HttpResponse.json(
						{ status: 409, code: "part_stock_insufficient" },
						{ status: 409 }
					);
				}
				part.stock += delta;
				return HttpResponse.json(envelope(part));
			}
		),
		http.post(apiUrl(`${base}/services`), async ({ request }) => {
			const service = {
				...(await record(request)),
				id: `srv-${writes.length}`,
			};
			catalog.services.push(service as StoredService);
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

	return { catalog, writes, reads, listQueries };
}
