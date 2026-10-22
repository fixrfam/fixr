import type { PartRow, ServiceRow, SupplierRow } from "@fixr/mock";
import { describe, expect, it } from "vitest";
import {
	buildPartRows,
	buildServiceRows,
	buildSupplierRows,
	getStockStatus,
	type PartsData,
	type StockStatusId,
	searchParts,
	searchServices,
	searchSuppliers,
} from "./data";

const supplier = (id: string, overrides: Partial<SupplierRow> = {}) =>
	({
		id,
		name: `Supplier ${id}`,
		cnpj: "12.345.678/0001-90",
		contact: "Renata",
		phone: "(11) 3456-7890",
		email: `${id}@supplier.test`,
		...overrides,
	}) satisfies SupplierRow;

const part = (id: string, overrides: Partial<PartRow> = {}) =>
	({
		id,
		sku: `SKU-${id}`,
		name: `Part ${id}`,
		category: "Baterias",
		costPrice: 10,
		salePrice: 20,
		stock: 5,
		minStock: 2,
		supplierId: "sup-a",
		...overrides,
	}) satisfies PartRow;

const service = (id: string, overrides: Partial<ServiceRow> = {}) =>
	({
		id,
		name: `Service ${id}`,
		description: "Repair",
		estimatedDurationMinutes: 30,
		price: 100,
		partIds: [],
		deviceCategories: ["Telefonia"],
		testInstructions: [],
		testParameters: [],
		...overrides,
	}) satisfies ServiceRow;

const data: PartsData = {
	suppliers: [
		supplier("sup-a", { name: "Power Cell" }),
		supplier("sup-b", { name: "Tela Express", cnpj: "98.765.432/0001-10" }),
	],
	parts: [
		part("p1", { name: "Bateria iPhone 11", supplierId: "sup-a" }),
		part("p2", {
			name: "Tela Galaxy S22",
			category: "Telas e displays",
			supplierId: "sup-b",
			stock: 1,
		}),
		part("p3", {
			name: "Conector USB-C",
			category: "Conectores",
			supplierId: "sup-a",
			stock: 0,
		}),
		part("p4", {
			name: "Orphan part",
			category: "Áudio",
			supplierId: "sup-gone",
		}),
	],
	services: [
		service("s1", { name: "Troca de bateria", partIds: ["p1"] }),
		service("s2", {
			name: "Troca de tela",
			partIds: ["p2", "p1", "missing"],
			deviceCategories: ["Notebook e Informática"],
		}),
		service("s3", { name: "Limpeza", partIds: [] }),
	],
};

const statusLabel = (status: StockStatusId) =>
	({ in_stock: "In stock", low_stock: "Low stock", out_of_stock: "Out" })[
		status
	];

describe("getStockStatus", () => {
	it.each([
		[5, 2, "in_stock"],
		[2, 2, "low_stock"],
		[1, 2, "low_stock"],
		[0, 2, "out_of_stock"],
		[-1, 0, "out_of_stock"],
		[0, 0, "out_of_stock"],
	] as const)("stock %i with minimum %i is %s", (stock, minStock, status) => {
		expect(getStockStatus(part("x", { stock, minStock }))).toBe(status);
	});
});

describe("buildPartRows", () => {
	const rows = buildPartRows(data);

	it("joins the supplier and the services that use each part", () => {
		const battery = rows.find((row) => row.id === "p1")!;

		expect(battery.supplier?.name).toBe("Power Cell");
		expect(battery.services.map((s) => s.id)).toEqual(["s1", "s2"]);
		expect(battery.stockStatus).toBe("in_stock");
	});

	it("keeps a part whose supplier no longer exists", () => {
		expect(rows.find((row) => row.id === "p4")?.supplier).toBeNull();
	});
});

describe("buildServiceRows", () => {
	const rows = buildServiceRows(data);

	it("resolves parts in order and drops ids that no longer exist", () => {
		const screen = rows.find((row) => row.id === "s2")!;

		expect(screen.parts.map((p) => p.id)).toEqual(["p2", "p1"]);
	});

	it("lists each supplier of the service's parts once", () => {
		const screen = rows.find((row) => row.id === "s2")!;

		expect(screen.suppliers.map((s) => s.id)).toEqual(["sup-b", "sup-a"]);
		expect(
			buildServiceRows({
				...data,
				services: [service("s", { partIds: ["p1", "p3"] })],
			})[0]?.suppliers.map((s) => s.id)
		).toEqual(["sup-a"]);
	});

	it("handles a service without parts", () => {
		const cleaning = rows.find((row) => row.id === "s3")!;

		expect(cleaning.parts).toEqual([]);
		expect(cleaning.suppliers).toEqual([]);
	});
});

describe("buildSupplierRows", () => {
	const rows = buildSupplierRows(data);

	it("lists the parts a supplier provides and the services that use them", () => {
		const power = rows.find((row) => row.id === "sup-a")!;

		expect(power.parts.map((p) => p.id)).toEqual(["p1", "p3"]);
		expect(power.services.map((s) => s.id)).toEqual(["s1", "s2"]);
	});
});

describe("searchParts", () => {
	const rows = buildPartRows(data);
	const ids = (search: string) =>
		searchParts(rows, search, statusLabel).map((row) => row.id);

	it("returns every row for a blank search", () => {
		expect(ids("   ")).toEqual(["p1", "p2", "p3", "p4"]);
	});

	it("ignores case and accents", () => {
		expect(ids("BATÉRIA")).toEqual(["p1"]);
	});

	it("requires every term to match some field", () => {
		// "bateria" matches the part, "power" its supplier.
		expect(ids("bateria power")).toEqual(["p1"]);
		expect(ids("bateria express")).toEqual([]);
	});

	it("finds parts by supplier CNPJ with or without the mask", () => {
		expect(ids("98.765.432/0001-10")).toEqual(["p2"]);
		expect(ids("98765432000110")).toEqual(["p2"]);
	});

	it("finds parts by the translated stock status", () => {
		expect(ids("out")).toEqual(["p3"]);
		expect(ids("low stock")).toEqual(["p2"]);
	});

	it("finds parts by the services that use them", () => {
		// "Troca de tela" uses the screen and the battery.
		expect(ids("troca de tela")).toEqual(["p1", "p2"]);
	});
});

describe("searchServices", () => {
	const rows = buildServiceRows(data);
	const ids = (search: string) =>
		searchServices(rows, search).map((row) => row.id);

	it("returns every row for a blank search", () => {
		expect(ids("")).toEqual(["s1", "s2", "s3"]);
	});

	it("matches the device category, parts and suppliers", () => {
		expect(ids("notebook")).toEqual(["s2"]);
		expect(ids("usb")).toEqual([]);
		expect(ids("power cell")).toEqual(["s1", "s2"]);
	});
});

describe("searchSuppliers", () => {
	const rows = buildSupplierRows(data);
	const ids = (search: string) =>
		searchSuppliers(rows, search).map((row) => row.id);

	it("returns every row for a blank search", () => {
		expect(ids(" ")).toEqual(["sup-a", "sup-b"]);
	});

	it("matches the phone with or without formatting", () => {
		expect(ids("3456-7890")).toEqual(["sup-a", "sup-b"]);
		expect(ids("1134567890")).toEqual(["sup-a", "sup-b"]);
	});

	it("matches the parts and services a supplier is involved in", () => {
		expect(ids("conector")).toEqual(["sup-a"]);
		expect(ids("troca de tela")).toEqual(["sup-a", "sup-b"]);
		expect(ids("limpeza")).toEqual([]);
	});
});
