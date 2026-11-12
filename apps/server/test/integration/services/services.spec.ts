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

/** Deletes are admin-only; every other route runs as the least privileged role allowed. */
async function session(role: "manager" | "admin" = "manager") {
	return await createEmployeeSession(app, { role });
}

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
		const { token, company } = await session();
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

	it("prices the service as labor plus the current sale price of its parts", async () => {
		const { token, company } = await session();
		const supplier = await makeSupplier({ companyId: company.id });
		const [screen, glue] = await Promise.all([
			makePart({
				companyId: company.id,
				supplierId: supplier.id,
				salePrice: 890.5,
			}),
			makePart({
				companyId: company.id,
				supplierId: supplier.id,
				salePrice: 9.9,
			}),
		]);
		const service = await makeService({
			companyId: company.id,
			price: 150,
			partIds: [screen.id, glue.id],
		});
		const url = `/companies/${company.subdomain}/services`;

		const [one, list] = await Promise.all([
			authedInject(app, token, { method: "GET", url: `${url}/${service.id}` }),
			authedInject(app, token, { method: "GET", url: `${url}?page=1` }),
		]);

		const pricing = { price: 150, partsPrice: 900.4, totalPrice: 1050.4 };
		expect(one.json().data).toMatchObject(pricing);
		expect(list.json().data.records).toEqual([
			expect.objectContaining(pricing),
		]);
	});

	it("refuses parts from another company", async () => {
		const { token, company } = await session();
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
		const { token, company } = await session();
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
		const { token, company } = await session();
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
		const { token, company } = await session("admin");
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
		const { token, company } = await session();
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
