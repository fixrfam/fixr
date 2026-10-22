import type { PartRow, ServiceRow, SupplierRow } from "@fixr/mock";

export type StockStatusId = "in_stock" | "low_stock" | "out_of_stock";

export const STOCK_STATUS_LABELS: Record<StockStatusId, string> = {
	in_stock: "Em estoque",
	low_stock: "Estoque baixo",
	out_of_stock: "Sem estoque",
};

export interface PartTableRow extends PartRow {
	supplier: SupplierRow | null;
	services: ServiceRow[];
	stockStatus: StockStatusId;
}

export interface ServiceTableRow extends ServiceRow {
	parts: PartRow[];
	suppliers: SupplierRow[];
}

export interface SupplierTableRow extends SupplierRow {
	parts: PartRow[];
	services: ServiceRow[];
}

export function getStockStatus(part: PartRow): StockStatusId {
	if (part.stock <= 0) return "out_of_stock";
	if (part.stock <= part.minStock) return "low_stock";
	return "in_stock";
}

export interface PartsData {
	parts: PartRow[];
	services: ServiceRow[];
	suppliers: SupplierRow[];
}

function unique<T>(items: T[]): T[] {
	return Array.from(new Set(items));
}

export function buildPartRows({
	parts,
	services,
	suppliers,
}: PartsData): PartTableRow[] {
	const suppliersById = new Map(suppliers.map((s) => [s.id, s]));

	return parts.map((part) => ({
		...part,
		supplier: suppliersById.get(part.supplierId) ?? null,
		services: services.filter((s) => s.partIds.includes(part.id)),
		stockStatus: getStockStatus(part),
	}));
}

export function buildServiceRows({
	parts,
	services,
	suppliers,
}: PartsData): ServiceTableRow[] {
	const suppliersById = new Map(suppliers.map((s) => [s.id, s]));
	const partsById = new Map(parts.map((p) => [p.id, p]));

	return services.map((service) => {
		const serviceParts = service.partIds
			.map((id) => partsById.get(id))
			.filter((p): p is PartRow => Boolean(p));

		return {
			...service,
			parts: serviceParts,
			suppliers: unique(
				serviceParts.map((p) => suppliersById.get(p.supplierId))
			).filter((s): s is SupplierRow => Boolean(s)),
		};
	});
}

export function buildSupplierRows({
	parts,
	services,
	suppliers,
}: PartsData): SupplierTableRow[] {
	return suppliers.map((supplier) => {
		const supplierParts = parts.filter((p) => p.supplierId === supplier.id);
		const partIds = new Set(supplierParts.map((p) => p.id));

		return {
			...supplier,
			parts: supplierParts,
			services: services.filter((s) => s.partIds.some((id) => partIds.has(id))),
		};
	});
}

const DIACRITICS_REGEX = /\p{Diacritic}/gu;
const NON_DIGITS_REGEX = /\D/g;
const WHITESPACE_REGEX = /\s+/;

function normalize(value: string): string {
	return value.normalize("NFD").replace(DIACRITICS_REGEX, "").toLowerCase();
}

function supplierFields(supplier: SupplierRow): string[] {
	return [
		supplier.name,
		supplier.cnpj,
		supplier.cnpj.replace(NON_DIGITS_REGEX, ""),
		supplier.contact,
		supplier.phone,
		supplier.phone.replace(NON_DIGITS_REGEX, ""),
		supplier.email,
	];
}

function partFields(part: PartRow): string[] {
	return [part.sku, part.name, part.category];
}

function serviceFields(service: ServiceRow): string[] {
	return [service.name, service.description, ...service.deviceCategories];
}

/**
 * Every term typed in the search must match at least one of the fields,
 * so "bateria power" finds batteries supplied by Power Cell.
 */
function matchesSearch(search: string, fields: string[]): boolean {
	const terms = normalize(search).split(WHITESPACE_REGEX).filter(Boolean);
	if (terms.length === 0) return true;

	const searchable = fields.filter(Boolean).map(normalize);
	return terms.every((term) => searchable.some((v) => v.includes(term)));
}

export function searchParts(
	rows: PartTableRow[],
	search: string
): PartTableRow[] {
	if (!search.trim()) return rows;

	return rows.filter((row) =>
		matchesSearch(search, [
			...partFields(row),
			STOCK_STATUS_LABELS[row.stockStatus],
			...(row.supplier ? supplierFields(row.supplier) : []),
			...row.services.flatMap(serviceFields),
		])
	);
}

export function searchServices(
	rows: ServiceTableRow[],
	search: string
): ServiceTableRow[] {
	if (!search.trim()) return rows;

	return rows.filter((row) =>
		matchesSearch(search, [
			...serviceFields(row),
			...row.parts.flatMap(partFields),
			...row.suppliers.flatMap(supplierFields),
		])
	);
}

export function searchSuppliers(
	rows: SupplierTableRow[],
	search: string
): SupplierTableRow[] {
	if (!search.trim()) return rows;

	return rows.filter((row) =>
		matchesSearch(search, [
			...supplierFields(row),
			...row.parts.flatMap(partFields),
			...row.services.flatMap(serviceFields),
		])
	);
}
