import { describe, expect, it } from "vitest";
import {
	makeCompany,
	makePart,
	makeService,
	makeSupplier,
} from "../../factories";
import { createTestApp } from "../../helpers/app";
import { authedInject, createEmployeeSession } from "../../helpers/auth";

const app = await createTestApp();

/** Parts, services and suppliers are admin-only in the current RBAC matrix. */
async function adminSession() {
	return await createEmployeeSession(app, { role: "admin" });
}

const supplierBody = {
	name: "TechParts Distribuidora",
	cnpj: "12.345.678/0001-90",
	contact: "Renata",
	phone: "(11) 3456-7890",
	email: "vendas@techparts.com.br",
};

describe("suppliers", () => {
	it("creates a supplier storing the CNPJ with digits only", async () => {
		const { token, company } = await adminSession();

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/suppliers`,
			payload: supplierBody,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json().data).toMatchObject({
			name: supplierBody.name,
			cnpj: "12345678000190",
			companyId: company.id,
		});
	});

	it("refuses a CNPJ already used in the same company", async () => {
		const { token, company } = await adminSession();
		const create = () =>
			authedInject(app, token, {
				method: "POST",
				url: `/companies/${company.subdomain}/suppliers`,
				payload: supplierBody,
			});

		await create();
		const duplicate = await create();

		expect(duplicate.statusCode).toBe(409);
		expect(duplicate.json().code).toBe("supplier_cnpj_conflict");
	});

	it("allows the same CNPJ in another company", async () => {
		const first = await adminSession();
		const second = await adminSession();

		for (const { token, company } of [first, second]) {
			const response = await authedInject(app, token, {
				method: "POST",
				url: `/companies/${company.subdomain}/suppliers`,
				payload: supplierBody,
			});
			expect(response.statusCode).toBe(201);
		}
	});

	it("lists only the company's suppliers, with search", async () => {
		const { token, company } = await adminSession();
		const other = await makeCompany();
		await makeSupplier({ companyId: company.id, name: "Alpha Peças" });
		await makeSupplier({ companyId: company.id, name: "Beta Import" });
		await makeSupplier({ companyId: other.id, name: "Alpha Foreign" });

		const all = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/suppliers?page=1&sort=name`,
		});
		const search = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/suppliers?page=1&query=Alpha`,
		});

		expect(
			all.json().data.records.map((s: { name: string }) => s.name)
		).toEqual(["Alpha Peças", "Beta Import"]);
		expect(search.json().data.pagination.total_records).toBe(1);
	});

	it("refuses to delete a supplier that still has parts", async () => {
		const { token, company } = await adminSession();
		const supplier = await makeSupplier({ companyId: company.id });
		await makePart({ companyId: company.id, supplierId: supplier.id });

		const response = await authedInject(app, token, {
			method: "DELETE",
			url: `/companies/${company.subdomain}/suppliers/${supplier.id}`,
		});

		expect(response.statusCode).toBe(409);
		expect(response.json().code).toBe("supplier_in_use");
	});

	it("updates and deletes an unused supplier", async () => {
		const { token, company } = await adminSession();
		const supplier = await makeSupplier({ companyId: company.id });
		const url = `/companies/${company.subdomain}/suppliers/${supplier.id}`;

		const patched = await authedInject(app, token, {
			method: "PATCH",
			url,
			payload: { contact: "Marcos" },
		});
		const deleted = await authedInject(app, token, { method: "DELETE", url });
		const missing = await authedInject(app, token, { method: "GET", url });

		expect(patched.json().data.contact).toBe("Marcos");
		expect(deleted.statusCode).toBe(200);
		expect(missing.statusCode).toBe(404);
	});

	it("hides another company's supplier", async () => {
		const { token, company } = await adminSession();
		const other = await makeCompany();
		const foreign = await makeSupplier({ companyId: other.id });

		const response = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/suppliers/${foreign.id}`,
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().code).toBe("supplier_not_found");
	});

	it("refuses a subdomain that is not the caller's company", async () => {
		const { token } = await adminSession();
		const other = await makeCompany();

		const response = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${other.subdomain}/suppliers?page=1`,
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().code).toBe("not_allowed");
	});
});

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
		const { token, company } = await adminSession();
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
		const { token, company } = await adminSession();
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
		const { token, company } = await adminSession();
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
		const { token, company } = await adminSession();
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
		const { token, company } = await adminSession();
		const supplier = await makeSupplier({ companyId: company.id });
		const part = await makePart({
			companyId: company.id,
			supplierId: supplier.id,
			costPrice: 100,
			salePrice: 180,
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
		expect(ok.json().data).toMatchObject({ salePrice: 150, stock: 9 });
	});

	it("shows the new supplier name on a cached part after a rename", async () => {
		const { token, company } = await adminSession();
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
		const { token, company } = await adminSession();
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
});

describe("services", () => {
	const serviceBody = (partIds: string[]) => ({
		name: "Troca de tela",
		description: "Substituição do display e teste de toque.",
		estimatedDurationMinutes: 60,
		price: 150,
		partIds,
		deviceCategories: ["Telefonia"],
		testInstructions: ["Testar o toque"],
		testParameters: ["Grade completa sem falhas"],
	});

	it("creates a service linking each part once", async () => {
		const { token, company } = await adminSession();
		const supplier = await makeSupplier({ companyId: company.id });
		const part = await makePart({
			companyId: company.id,
			supplierId: supplier.id,
		});

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/services`,
			payload: serviceBody([part.id, part.id]),
		});

		expect(response.statusCode).toBe(201);
		expect(response.json().data).toMatchObject({
			name: "Troca de tela",
			price: 150,
			partIds: [part.id],
			testInstructions: ["Testar o toque"],
		});
	});

	it("refuses parts from another company", async () => {
		const { token, company } = await adminSession();
		const other = await makeCompany();
		const supplier = await makeSupplier({ companyId: other.id });
		const foreign = await makePart({
			companyId: other.id,
			supplierId: supplier.id,
		});

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/services`,
			payload: serviceBody([foreign.id]),
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().code).toBe("service_part_not_found");
	});

	it("lists with part ids and filters by device category", async () => {
		const { token, company } = await adminSession();
		const supplier = await makeSupplier({ companyId: company.id });
		const part = await makePart({
			companyId: company.id,
			supplierId: supplier.id,
		});
		await makeService({
			companyId: company.id,
			name: "Troca de bateria",
			partIds: [part.id],
			deviceCategories: ["Telefonia"],
		});
		await makeService({
			companyId: company.id,
			name: "Limpeza de notebook",
			deviceCategories: ["Notebook e Informática"],
		});

		const response = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/services?page=1&deviceCategory=Telefonia`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().data.records).toEqual([
			expect.objectContaining({
				name: "Troca de bateria",
				partIds: [part.id],
			}),
		]);
	});

	it("replaces the linked parts on update", async () => {
		const { token, company } = await adminSession();
		const supplier = await makeSupplier({ companyId: company.id });
		const [first, second] = await Promise.all([
			makePart({ companyId: company.id, supplierId: supplier.id }),
			makePart({ companyId: company.id, supplierId: supplier.id }),
		]);
		const service = await makeService({
			companyId: company.id,
			partIds: [first.id],
		});

		const response = await authedInject(app, token, {
			method: "PATCH",
			url: `/companies/${company.subdomain}/services/${service.id}`,
			payload: { partIds: [second.id], price: 99.9 },
		});

		expect(response.json().data).toMatchObject({
			partIds: [second.id],
			price: 99.9,
		});
	});

	it("drops a deleted part from the services that used it", async () => {
		const { token, company } = await adminSession();
		const supplier = await makeSupplier({ companyId: company.id });
		const part = await makePart({
			companyId: company.id,
			supplierId: supplier.id,
		});
		const service = await makeService({
			companyId: company.id,
			partIds: [part.id],
		});
		const serviceUrl = `/companies/${company.subdomain}/services/${service.id}`;

		await authedInject(app, token, { method: "GET", url: serviceUrl });
		await authedInject(app, token, {
			method: "DELETE",
			url: `/companies/${company.subdomain}/parts/${part.id}`,
		});
		const after = await authedInject(app, token, {
			method: "GET",
			url: serviceUrl,
		});

		expect(after.json().data.partIds).toEqual([]);
	});

	it("hides another company's service", async () => {
		const { token, company } = await adminSession();
		const other = await makeCompany();
		const foreign = await makeService({ companyId: other.id });

		const response = await authedInject(app, token, {
			method: "PATCH",
			url: `/companies/${company.subdomain}/services/${foreign.id}`,
			payload: { price: 1 },
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().code).toBe("service_not_found");
	});
});
