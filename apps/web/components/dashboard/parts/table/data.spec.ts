import { describe, expect, it } from "vitest";
import { getStockStatus, toPartRow } from "./data";

describe("getStockStatus", () => {
	it.each([
		[5, 2, "in_stock"],
		[2, 2, "low_stock"],
		[1, 2, "low_stock"],
		[0, 2, "out_of_stock"],
		[-1, 0, "out_of_stock"],
		[0, 0, "out_of_stock"],
	] as const)("stock %i with minimum %i is %s", (stock, minStock, status) => {
		expect(getStockStatus({ stock, minStock })).toBe(status);
	});
});

describe("toPartRow", () => {
	it("adds the stock status to the part", () => {
		const part = {
			id: "p1",
			sku: "SKU-1",
			name: "Part",
			category: "Baterias",
			costPrice: 10,
			salePrice: 20,
			stock: 1,
			minStock: 2,
			supplierId: "s1",
		};

		expect(toPartRow(part)).toEqual({ ...part, stockStatus: "low_stock" });
	});
});
