import { describe, expect, it } from "vitest";
import { estimateTotals, itemTotals, lineTotal } from "./money";

describe("lineTotal", () => {
	it("multiplies in cents", () => {
		expect(lineTotal({ unitPrice: 0.1, quantity: 3 })).toBe(0.3);
		expect(lineTotal({ unitPrice: 19.99, quantity: 2 })).toBe(39.98);
	});
});

describe("itemTotals", () => {
	it("splits parts and services and adds them up", () => {
		expect(
			itemTotals([
				{ type: "part", unitPrice: 0.1, quantity: 1 },
				{ type: "part", unitPrice: 0.2, quantity: 1 },
				{ type: "service", unitPrice: 150, quantity: 2 },
			])
		).toEqual({ parts: 0.3, services: 300, total: 300.3 });
	});

	it("is zero for no items", () => {
		expect(itemTotals([])).toEqual({ parts: 0, services: 0, total: 0 });
	});
});

describe("estimateTotals", () => {
	it("applies the discount on the subtotal, rounded to cents", () => {
		expect(
			estimateTotals(
				[
					{ type: "part", unitPrice: 890.5, quantity: 1 },
					{ type: "service", unitPrice: 150, quantity: 1 },
				],
				10
			)
		).toEqual({
			parts: 890.5,
			services: 150,
			subtotal: 1040.5,
			discount: 104.05,
			total: 936.45,
		});
	});

	it("rounds a fractional cent discount", () => {
		expect(
			estimateTotals([{ type: "part", unitPrice: 0.99, quantity: 1 }], 12.5)
		).toMatchObject({ discount: 0.12, total: 0.87 });
	});
});
