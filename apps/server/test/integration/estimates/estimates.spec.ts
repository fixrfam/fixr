import { db } from "@fixr/db/connection";
import { serviceOrderItems } from "@fixr/db/schema";
import { describe, expect, it } from "vitest";
import {
	makeCategory,
	makeCompany,
	makeCustomer,
	makeMaker,
	makeServiceOrder,
} from "../../factories";
import { createTestApp } from "../../helpers/app";
import { authedInject, createEmployeeSession } from "../../helpers/auth";

const app = await createTestApp();

/** A financial employee (creates and sends estimates) with one priced service order. */
async function setup({ withItems = true } = {}) {
	const session = await createEmployeeSession(app, { role: "financial" });
	const { company, employee } = session;
	const [customer, maker, category] = await Promise.all([
		makeCustomer({ companyId: company.id, name: "Maria Oliveira" }),
		makeMaker({ name: "Apple" }),
		makeCategory(),
	]);
	const serviceOrder = await makeServiceOrder({
		companyId: company.id,
		clientId: customer.id,
		employeeId: employee.id,
		deviceMakerId: maker.id,
		deviceCategoryId: category.id,
		deviceModel: "iPhone 13",
	});
	if (withItems) {
		await db.insert(serviceOrderItems).values([
			{
				serviceOrderId: serviceOrder.id,
				type: "part",
				name: "Tela OLED",
				quantity: 1,
				unitPrice: 890.5,
				createdAt: new Date(Date.now() - 2000),
			},
			{
				serviceOrderId: serviceOrder.id,
				type: "service",
				name: "Troca de tela",
				quantity: 1,
				unitPrice: 150,
				createdAt: new Date(),
			},
		]);
	}
	const base = `/companies/${company.subdomain}/estimates`;

	return { ...session, customer, serviceOrder, base };
}

async function createEstimate(
	ctx: Awaited<ReturnType<typeof setup>>,
	body: Record<string, unknown> = {}
) {
	return await authedInject(app, ctx.token, {
		method: "POST",
		url: ctx.base,
		payload: { serviceOrderId: ctx.serviceOrder.id, ...body },
	});
}

describe("POST /companies/:subdomain/estimates", () => {
	it("copies the service order items and computes the totals", async () => {
		const ctx = await setup();

		const response = await createEstimate(ctx, { discountPercentage: 10 });

		expect(response.statusCode).toBe(201);
		expect(response.json().data).toMatchObject({
			number: 1,
			status: "draft",
			client: { id: ctx.customer.id, name: "Maria Oliveira" },
			createdBy: ctx.employee.id,
			items: [
				{ name: "Tela OLED", type: "part", total: 890.5 },
				{ name: "Troca de tela", type: "service", total: 150 },
			],
			totals: { subtotal: 1040.5, discount: 104.05, total: 936.45 },
		});
	});

	it("numbers estimates sequentially per company", async () => {
		const ctx = await setup();
		const other = await setup();

		await createEstimate(ctx);
		const second = await createEstimate(ctx);
		const otherFirst = await createEstimate(other);

		expect(second.json().data.number).toBe(2);
		expect(otherFirst.json().data.number).toBe(1);
	});

	it("keeps the copied items when the service order changes", async () => {
		const ctx = await setup();
		const created = await createEstimate(ctx);

		await db.delete(serviceOrderItems);
		const after = await authedInject(app, ctx.token, {
			method: "GET",
			url: `${ctx.base}/${created.json().data.id}`,
		});

		expect(after.json().data.items).toHaveLength(2);
	});

	it("refuses an order without items", async () => {
		const ctx = await setup({ withItems: false });

		const response = await createEstimate(ctx);

		expect(response.statusCode).toBe(400);
		expect(response.json().code).toBe("estimate_service_order_empty");
	});

	it("refuses another company's service order", async () => {
		const ctx = await setup();
		const { token, company } = await createEmployeeSession(app, {
			role: "financial",
			company: await makeCompany(),
		});

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/estimates`,
			payload: { serviceOrderId: ctx.serviceOrder.id },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().code).toBe("estimate_service_order_not_found");
	});
});

describe("estimate lifecycle", () => {
	it("edits only drafts and follows the allowed transitions", async () => {
		const ctx = await setup();
		const { id } = (await createEstimate(ctx)).json().data;
		const url = `${ctx.base}/${id}`;
		const status = (value: string) =>
			authedInject(app, ctx.token, {
				method: "PATCH",
				url: `${url}/status`,
				payload: { status: value },
			});

		const edited = await authedInject(app, ctx.token, {
			method: "PATCH",
			url,
			payload: { notes: "Garantia de 90 dias" },
		});
		const skipped = await status("approved");
		const sent = await status("sent");
		const lockedEdit = await authedInject(app, ctx.token, {
			method: "PATCH",
			url,
			payload: { discountPercentage: 50 },
		});
		const approved = await status("approved");
		const reopened = await status("draft");

		expect(edited.json().data.notes).toBe("Garantia de 90 dias");
		expect(skipped.statusCode).toBe(409);
		expect(skipped.json().code).toBe("estimate_invalid_transition");
		expect(sent.json().data.status).toBe("sent");
		expect(lockedEdit.statusCode).toBe(409);
		expect(approved.json().data.status).toBe("approved");
		expect(reopened.statusCode).toBe(409);
	});

	it("deletes drafts only", async () => {
		const ctx = await setup();
		const { token } = await createEmployeeSession(app, {
			role: "admin",
			company: ctx.company,
		});
		const draft = (await createEstimate(ctx)).json().data;
		const sent = (await createEstimate(ctx)).json().data;
		await authedInject(app, token, {
			method: "PATCH",
			url: `${ctx.base}/${sent.id}/status`,
			payload: { status: "sent" },
		});

		const deletedDraft = await authedInject(app, token, {
			method: "DELETE",
			url: `${ctx.base}/${draft.id}`,
		});
		const deletedSent = await authedInject(app, token, {
			method: "DELETE",
			url: `${ctx.base}/${sent.id}`,
		});

		expect(deletedDraft.statusCode).toBe(200);
		expect(deletedSent.statusCode).toBe(409);
	});
});

describe("GET /companies/:subdomain/estimates", () => {
	it("lists with totals, filters by status and searches the client", async () => {
		const ctx = await setup();
		await createEstimate(ctx);
		const second = (await createEstimate(ctx)).json().data;
		await authedInject(app, ctx.token, {
			method: "PATCH",
			url: `${ctx.base}/${second.id}/status`,
			payload: { status: "sent" },
		});
		const list = (qs: string) =>
			authedInject(app, ctx.token, {
				method: "GET",
				url: `${ctx.base}?page=1&${qs}`,
			});

		const all = (await list("")).json().data;
		const sent = (await list("status=sent")).json().data;
		const byClient = (await list("query=Maria")).json().data;
		const byNumber = (await list("query=2")).json().data;

		expect(all.records.map((e: { number: number }) => e.number)).toEqual([
			2, 1,
		]);
		expect(all.records[0].totals.total).toBe(1040.5);
		expect(sent.pagination.total_records).toBe(1);
		expect(byClient.pagination.total_records).toBe(2);
		expect(byNumber.records.map((e: { number: number }) => e.number)).toEqual([
			2,
		]);
	});
});

describe("GET /companies/:subdomain/estimates/:estimateId/pdf", () => {
	it("renders the PDF in the requester's language", async () => {
		const ctx = await setup();
		const { id } = (await createEstimate(ctx)).json().data;

		const response = await authedInject(app, ctx.token, {
			method: "GET",
			url: `${ctx.base}/${id}/pdf`,
			headers: { "accept-language": "en" },
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["content-type"]).toBe("application/pdf");
		expect(response.headers["content-disposition"]).toBe(
			'inline; filename="estimate-0001.pdf"'
		);
		expect(response.rawPayload.subarray(0, 5).toString()).toBe("%PDF-");
	});

	it("hides another company's estimate", async () => {
		const ctx = await setup();
		const { id } = (await createEstimate(ctx)).json().data;
		const outsider = await createEmployeeSession(app, { role: "financial" });

		const response = await authedInject(app, outsider.token, {
			method: "GET",
			url: `/companies/${outsider.company.subdomain}/estimates/${id}/pdf`,
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().code).toBe("estimate_not_found");
	});
});
