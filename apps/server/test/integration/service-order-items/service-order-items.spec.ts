import { db, eq } from "@fixr/db/connection";
import { parts, serviceOrderItems } from "@fixr/db/schema";
import { describe, expect, it } from "vitest";
import {
	makeCategory,
	makeCompany,
	makeCustomer,
	makeMaker,
	makePart,
	makeService,
	makeServiceOrder,
	makeSupplier,
} from "../../factories";
import { createTestApp } from "../../helpers/app";
import { authedInject, createEmployeeSession } from "../../helpers/auth";

const app = await createTestApp();

/** A manager's session with one service order and a small catalog. */
async function setup() {
	const session = await createEmployeeSession(app, { role: "manager" });
	const { company, employee } = session;
	const [customer, maker, category, supplier] = await Promise.all([
		makeCustomer({ companyId: company.id }),
		makeMaker(),
		makeCategory(),
		makeSupplier({ companyId: company.id }),
	]);
	const serviceOrder = await makeServiceOrder({
		companyId: company.id,
		clientId: customer.id,
		employeeId: employee.id,
		deviceMakerId: maker.id,
		deviceCategoryId: category.id,
	});
	const part = await makePart({
		companyId: company.id,
		supplierId: supplier.id,
		name: "Tela OLED",
		salePrice: 890.5,
	});
	const service = await makeService({
		companyId: company.id,
		name: "Troca de tela",
		price: 150,
	});
	const url = `/companies/${company.subdomain}/service-orders/${serviceOrder.id}/items`;

	return { ...session, serviceOrder, part, service, url };
}

describe("service order items", () => {
	it("adds parts and services with catalog snapshots and totals", async () => {
		const { token, url, part, service } = await setup();

		await authedInject(app, token, {
			method: "POST",
			url,
			payload: { type: "part", itemId: part.id, quantity: 2 },
		});
		const response = await authedInject(app, token, {
			method: "POST",
			url,
			payload: { type: "service", itemId: service.id, unitPrice: 120 },
		});

		expect(response.statusCode).toBe(201);
		// Both items can land in the same second, so their order is not asserted.
		expect(response.json().data.items).toHaveLength(2);
		expect(response.json().data).toMatchObject({
			items: expect.arrayContaining([
				expect.objectContaining({
					type: "part",
					partId: part.id,
					name: "Tela OLED",
					quantity: 2,
					unitPrice: 890.5,
					total: 1781,
				}),
				expect.objectContaining({
					type: "service",
					serviceId: service.id,
					quantity: 1,
					unitPrice: 120,
					total: 120,
				}),
			]),
			totals: { parts: 1781, services: 120, total: 1901 },
		});
	});

	it("keeps the item when the catalog price changes or the part is deleted", async () => {
		const { token, url, part } = await setup();
		await authedInject(app, token, {
			method: "POST",
			url,
			payload: { type: "part", itemId: part.id },
		});

		await db.update(parts).set({ salePrice: 1 }).where(eq(parts.id, part.id));
		await db.delete(parts).where(eq(parts.id, part.id));
		const response = await authedInject(app, token, { method: "GET", url });

		expect(response.json().data.items).toEqual([
			expect.objectContaining({
				partId: null,
				name: "Tela OLED",
				unitPrice: 890.5,
			}),
		]);
	});

	it("updates the quantity and removes items", async () => {
		const { token, url, service } = await setup();
		await authedInject(app, token, {
			method: "POST",
			url,
			payload: { type: "service", itemId: service.id },
		});
		const [item] = await db.select().from(serviceOrderItems);

		const patched = await authedInject(app, token, {
			method: "PATCH",
			url: `${url}/${item!.id}`,
			payload: { quantity: 3 },
		});
		const removed = await authedInject(app, token, {
			method: "DELETE",
			url: `${url}/${item!.id}`,
		});

		expect(patched.json().data.totals.total).toBe(450);
		expect(removed.json().data).toEqual({
			items: [],
			totals: { parts: 0, services: 0, total: 0 },
		});
	});

	it("refuses a part of another company", async () => {
		const { token, url } = await setup();
		const other = await makeCompany();
		const supplier = await makeSupplier({ companyId: other.id });
		const foreign = await makePart({
			companyId: other.id,
			supplierId: supplier.id,
		});

		const response = await authedInject(app, token, {
			method: "POST",
			url,
			payload: { type: "part", itemId: foreign.id },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().code).toBe("service_order_catalog_item_not_found");
	});

	it("hides the items of another company's service order", async () => {
		const { url } = await setup();
		const { token, company } = await createEmployeeSession(app, {
			role: "manager",
		});

		const response = await authedInject(app, token, {
			method: "GET",
			url: url.replace(/companies\/[^/]+/, `companies/${company.subdomain}`),
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().code).toBe("service_order_not_found");
	});

	it("returns 404 for an item of another order", async () => {
		const { token, url } = await setup();

		const response = await authedInject(app, token, {
			method: "DELETE",
			url: `${url}/x0000000000000000000000x`,
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().code).toBe("service_order_item_not_found");
	});
});
