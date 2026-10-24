import { describe, expect, it } from "vitest";
import { makeCompany, makePart, makeSupplier } from "../../factories";
import { createTestApp } from "../../helpers/app";
import { authedInject, createEmployeeSession } from "../../helpers/auth";

const app = await createTestApp();

/** Deletes are admin-only; every other route runs as the least privileged role allowed. */
async function session(role: "warehouse" | "admin" = "warehouse") {
	return await createEmployeeSession(app, { role });
}

describe("parts", () => {
	const partBody = (supplierId: string) => ({
		sku: "TEL-IP13-OLED",
		name: "Tela OLED iPhone 13",
		category: "Telas e displays",
		costPrice: 480,
		salePrice: 890.5,
		stock: 6,
		minStock: 3,
		supplierId,
	});

	it("creates a part and returns numeric prices and the supplier", async () => {
		const { token, company } = await session();
		const supplier = await makeSupplier({ companyId: company.id });

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/parts`,
			payload: partBody(supplier.id),
		});

		expect(response.statusCode).toBe(201);
		expect(response.json().data).toMatchObject({
			sku: "TEL-IP13-OLED",
			costPrice: 480,
			salePrice: 890.5,
			supplier: { id: supplier.id, name: supplier.name },
		});
	});

	it("refuses a supplier from another company", async () => {
		const { token, company } = await session();
		const other = await makeCompany();
		const foreign = await makeSupplier({ companyId: other.id });

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/parts`,
			payload: partBody(foreign.id),
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().code).toBe("part_supplier_not_found");
	});

	it("refuses a duplicated SKU in the same company", async () => {
		const { token, company } = await session();
		const supplier = await makeSupplier({ companyId: company.id });
		const create = () =>
			authedInject(app, token, {
				method: "POST",
				url: `/companies/${company.subdomain}/parts`,
				payload: partBody(supplier.id),
			});

		await create();
		const duplicate = await create();

		expect(duplicate.statusCode).toBe(409);
		expect(duplicate.json().code).toBe("part_sku_conflict");
	});

	it("filters by category, search and low stock", async () => {
		const { token, company } = await session();
		const supplier = await makeSupplier({ companyId: company.id });
		await makePart({
			companyId: company.id,
			supplierId: supplier.id,
			name: "Bateria iPhone 11",
			category: "Baterias",
			stock: 1,
			minStock: 2,
		});
		await makePart({
			companyId: company.id,
			supplierId: supplier.id,
			name: "Tela Galaxy S22",
			category: "Telas e displays",
			stock: 10,
			minStock: 2,
		});
		const list = (qs: string) =>
			authedInject(app, token, {
				method: "GET",
				url: `/companies/${company.subdomain}/parts?page=1&${qs}`,
			});

		const names = async (qs: string) =>
			(await list(qs)).json().data.records.map((p: { name: string }) => p.name);

		expect(await names("category=Baterias")).toEqual(["Bateria iPhone 11"]);
		expect(await names("query=Galaxy")).toEqual(["Tela Galaxy S22"]);
		expect(await names("lowStock=true")).toEqual(["Bateria iPhone 11"]);
	});

	it("checks a single price change against the stored price", async () => {
		const { token, company } = await session();
		const supplier = await makeSupplier({ companyId: company.id });
		const part = await makePart({
			companyId: company.id,
			supplierId: supplier.id,
			costPrice: 100,
			salePrice: 180,
			stock: 4,
		});
		const url = `/companies/${company.subdomain}/parts/${part.id}`;

		const belowCost = await authedInject(app, token, {
			method: "PATCH",
			url,
			payload: { salePrice: 50 },
		});
		const ok = await authedInject(app, token, {
			method: "PATCH",
			url,
			payload: { salePrice: 150, stock: 9 },
		});

		expect(belowCost.statusCode).toBe(400);
		expect(belowCost.json().code).toBe("part_sale_price_below_cost");
		// The stock is ignored here: it only changes through an adjustment.
		expect(ok.json().data).toMatchObject({ salePrice: 150, stock: 4 });
	});

	it("shows the new supplier name on a cached part after a rename", async () => {
		const { token, company } = await session();
		const supplier = await makeSupplier({ companyId: company.id });
		const part = await makePart({
			companyId: company.id,
			supplierId: supplier.id,
		});
		const partUrl = `/companies/${company.subdomain}/parts/${part.id}`;

		await authedInject(app, token, { method: "GET", url: partUrl });
		await authedInject(app, token, {
			method: "PATCH",
			url: `/companies/${company.subdomain}/suppliers/${supplier.id}`,
			payload: { name: "Renamed Supplier" },
		});
		const after = await authedInject(app, token, {
			method: "GET",
			url: partUrl,
		});

		expect(after.json().data.supplier.name).toBe("Renamed Supplier");
	});

	it("hides another company's part", async () => {
		const { token, company } = await session("admin");
		const other = await makeCompany();
		const supplier = await makeSupplier({ companyId: other.id });
		const foreign = await makePart({
			companyId: other.id,
			supplierId: supplier.id,
		});

		const response = await authedInject(app, token, {
			method: "DELETE",
			url: `/companies/${company.subdomain}/parts/${foreign.id}`,
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().code).toBe("part_not_found");
	});

	describe("stock adjustments", () => {
		async function partWithStock(companyId: string, stock: number) {
			const supplier = await makeSupplier({ companyId });
			return await makePart({ companyId, supplierId: supplier.id, stock });
		}

		it("adds and removes units", async () => {
			const { token, company } = await session();
			const part = await partWithStock(company.id, 5);
			const url = `/companies/${company.subdomain}/parts/${part.id}/stock-adjustments`;

			const added = await authedInject(app, token, {
				method: "POST",
				url,
				payload: { delta: 3 },
			});
			const removed = await authedInject(app, token, {
				method: "POST",
				url,
				payload: { delta: -8 },
			});

			expect(added.statusCode).toBe(200);
			expect(added.json().data.stock).toBe(8);
			expect(removed.json().data.stock).toBe(0);
		});

		it("refuses to leave the stock below zero", async () => {
			const { token, company } = await session();
			const part = await partWithStock(company.id, 2);
			const url = `/companies/${company.subdomain}/parts/${part.id}`;

			const response = await authedInject(app, token, {
				method: "POST",
				url: `${url}/stock-adjustments`,
				payload: { delta: -3 },
			});
			const after = await authedInject(app, token, { method: "GET", url });

			expect(response.statusCode).toBe(409);
			expect(response.json().code).toBe("part_stock_insufficient");
			expect(after.json().data.stock).toBe(2);
		});

		it("applies concurrent adjustments without losing any", async () => {
			const { token, company } = await session();
			const part = await partWithStock(company.id, 0);
			const url = `/companies/${company.subdomain}/parts/${part.id}`;

			await Promise.all(
				Array.from({ length: 5 }, () =>
					authedInject(app, token, {
						method: "POST",
						url: `${url}/stock-adjustments`,
						payload: { delta: 2 },
					})
				)
			);
			const after = await authedInject(app, token, { method: "GET", url });

			expect(after.json().data.stock).toBe(10);
		});

		it("hides another company's part", async () => {
			const { token, company } = await session();
			const other = await makeCompany();
			const foreign = await partWithStock(other.id, 1);

			const response = await authedInject(app, token, {
				method: "POST",
				url: `/companies/${company.subdomain}/parts/${foreign.id}/stock-adjustments`,
				payload: { delta: 1 },
			});

			expect(response.statusCode).toBe(404);
		});
	});

	describe("role access", () => {
		it("lets a technician read the catalog but not adjust the stock", async () => {
			const { token, company } = await createEmployeeSession(app, {
				role: "technician",
			});
			const part = await makePart({
				companyId: company.id,
				supplierId: (await makeSupplier({ companyId: company.id })).id,
			});
			const url = `/companies/${company.subdomain}/parts/${part.id}`;

			const read = await authedInject(app, token, { method: "GET", url });
			const adjust = await authedInject(app, token, {
				method: "POST",
				url: `${url}/stock-adjustments`,
				payload: { delta: 1 },
			});

			expect(read.statusCode).toBe(200);
			expect(adjust.statusCode).toBe(403);
		});

		it("does not let a manager delete a part", async () => {
			const { token, company } = await createEmployeeSession(app, {
				role: "manager",
			});
			const part = await makePart({
				companyId: company.id,
				supplierId: (await makeSupplier({ companyId: company.id })).id,
			});

			const response = await authedInject(app, token, {
				method: "DELETE",
				url: `/companies/${company.subdomain}/parts/${part.id}`,
			});

			expect(response.statusCode).toBe(403);
		});
	});
});
