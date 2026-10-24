import { describe, expect, it } from "vitest";
import { makeCompany, makePart, makeSupplier } from "../../factories";
import { createTestApp } from "../../helpers/app";
import { authedInject, createEmployeeSession } from "../../helpers/auth";

const app = await createTestApp();

/** Deletes are admin-only; every other route runs as the least privileged role allowed. */
async function session(role: "warehouse" | "admin" = "warehouse") {
	return await createEmployeeSession(app, { role });
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
		const { token, company } = await session();

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
		const { token, company } = await session();
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
		const first = await session();
		const second = await session();

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
		const { token, company } = await session();
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
		const { token, company } = await session("admin");
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
		const { token, company } = await session("admin");
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
		const { token, company } = await session();
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
		const { token } = await session();
		const other = await makeCompany();

		const response = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${other.subdomain}/suppliers?page=1`,
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().code).toBe("not_allowed");
	});
});
