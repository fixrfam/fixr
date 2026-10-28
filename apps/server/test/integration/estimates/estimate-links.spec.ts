import { db, desc, eq } from "@fixr/db/connection";
import {
	estimates,
	serviceOrderHistory,
	serviceOrderItems,
	serviceOrders,
} from "@fixr/db/schema";
import { createEmailQueue } from "@fixr/mail/queue";
import { afterAll, describe, expect, it } from "vitest";
import { redis } from "@/src/config/redis";
import {
	makeCategory,
	makeCustomer,
	makeMaker,
	makeServiceOrder,
} from "../../factories";
import { createTestApp } from "../../helpers/app";
import { authedInject, createEmployeeSession } from "../../helpers/auth";

const app = await createTestApp();
const queue = createEmailQueue(redis);

afterAll(async () => {
	await queue.close();
});

/** A financial employee with a draft estimate of a priced service order. */
async function setup({ clientEmail = true, withServicePart = false } = {}) {
	const session = await createEmployeeSession(app, { role: "financial" });
	const { company, employee } = session;
	const [customer, maker, category] = await Promise.all([
		makeCustomer({
			companyId: company.id,
			name: "Maria Oliveira",
			...(clientEmail ? {} : { email: null }),
		}),
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
	const [serviceLine] = await db
		.insert(serviceOrderItems)
		.values({
			serviceOrderId: serviceOrder.id,
			type: "service",
			name: "Troca de tela",
			quantity: 1,
			unitPrice: 150,
		})
		.$returningId();
	if (withServicePart) {
		await db.insert(serviceOrderItems).values({
			serviceOrderId: serviceOrder.id,
			parentItemId: serviceLine!.id,
			type: "part",
			name: "Tela OLED",
			quantity: 1,
			unitPrice: 890,
		});
	}
	const base = `/companies/${company.subdomain}/estimates`;
	const created = await authedInject(app, session.token, {
		method: "POST",
		url: base,
		payload: { serviceOrderId: serviceOrder.id },
	});
	const estimateId: string = created.json().data.id;

	return { ...session, customer, serviceOrder, base, estimateId };
}

type Ctx = Awaited<ReturnType<typeof setup>>;

function send(ctx: Ctx, payload: Record<string, unknown> = {}) {
	return authedInject(app, ctx.token, {
		method: "POST",
		url: `${ctx.base}/${ctx.estimateId}/send`,
		payload,
		headers: { "accept-language": "pt-BR" },
	});
}

/** Token of the latest estimate email queued for `to`. */
async function sentToken(to: string) {
	const jobs = await queue.getJobs(["waiting", "delayed", "prioritized"]);
	const urls = jobs
		.filter(
			(job) =>
				job.data.job === "sendEstimateEmail" && job.data.payload.to === to
		)
		.sort((a, b) => b.timestamp - a.timestamp)
		.map((job) => (job.data.payload as { ctaUrl: string }).ctaUrl);
	return urls[0]?.split("/estimate/")[1] ?? "";
}

/** Send the estimate and return the link token (empty when sending failed). */
async function sendAndGetToken(ctx: Ctx) {
	const response = await send(ctx);
	return response.statusCode === 200
		? await sentToken(ctx.customer.email ?? "")
		: "";
}

async function serviceOrderStatus(id: string) {
	const [row] = await db
		.select({ status: serviceOrders.status })
		.from(serviceOrders)
		.where(eq(serviceOrders.id, id));
	return row?.status;
}

/** The order's latest history entry: where it went and who moved it. */
async function lastMove(id: string) {
	const [row] = await db
		.select({
			to: serviceOrderHistory.toStatus,
			employeeId: serviceOrderHistory.employeeId,
		})
		.from(serviceOrderHistory)
		.where(eq(serviceOrderHistory.serviceOrderId, id))
		.orderBy(desc(serviceOrderHistory.createdAt))
		.limit(1);
	return row;
}

describe("POST /companies/:subdomain/estimates/:estimateId/send", () => {
	it("queues the email with the PDF and moves the order to waiting approval", async () => {
		const ctx = await setup();

		const response = await send(ctx);

		expect(response.statusCode).toBe(200);
		expect(response.json()).toMatchObject({
			code: "send_estimate_success",
			data: { status: "sent", sentTo: ctx.customer.email },
		});
		expect(response.json().data).not.toHaveProperty("publicTokenHash");
		expect(await serviceOrderStatus(ctx.serviceOrder.id)).toBe(
			"waiting_approval"
		);
		// The order's history names who sent it.
		expect(await lastMove(ctx.serviceOrder.id)).toEqual({
			to: "waiting_approval",
			employeeId: ctx.employee.id,
		});

		const jobs = await queue.getJobs(["waiting", "delayed", "prioritized"]);
		const job = jobs.find(
			(j) =>
				j.data.job === "sendEstimateEmail" &&
				j.data.payload.to === ctx.customer.email
		);
		expect(job?.data.payload).toMatchObject({
			locale: "pt-BR",
			number: "0001",
			device: "Apple iPhone 13",
			attachment: { fileName: "orcamento-0001.pdf" },
		});
		const pdf = Buffer.from(
			(job?.data.payload as { attachment: { contentBase64: string } })
				.attachment.contentBase64,
			"base64"
		);
		expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
	});

	it("never stores the token itself", async () => {
		const ctx = await setup();
		const token = await sendAndGetToken(ctx);

		const [row] = await db
			.select({ hash: estimates.publicTokenHash })
			.from(estimates)
			.where(eq(estimates.id, ctx.estimateId));

		expect(token).toHaveLength(43);
		expect(row?.hash).toHaveLength(64);
		expect(row?.hash).not.toBe(token);
	});

	it("asks for an email when the client has none", async () => {
		const ctx = await setup({ clientEmail: false });

		const refused = await send(ctx);
		const sent = await send(ctx, { email: "outro@fixr.test" });

		expect(refused.statusCode).toBe(400);
		expect(refused.json().code).toBe("estimate_no_recipient");
		expect(sent.statusCode).toBe(200);
		expect(sent.json().data.sentTo).toBe("outro@fixr.test");
	});

	it("replaces the previous link when sent again", async () => {
		const ctx = await setup();
		const first = await sendAndGetToken(ctx);
		const second = await sendAndGetToken(ctx);

		const old = await app.inject({ url: `/estimate-links/${first}` });
		const current = await app.inject({ url: `/estimate-links/${second}` });

		expect(old.statusCode).toBe(404);
		expect(old.json().code).toBe("estimate_link_invalid");
		expect(current.statusCode).toBe(200);
	});

	it("does not send another company's estimate", async () => {
		const ctx = await setup();
		const outsider = await createEmployeeSession(app, { role: "financial" });

		const response = await authedInject(app, outsider.token, {
			method: "POST",
			url: `/companies/${outsider.company.subdomain}/estimates/${ctx.estimateId}/send`,
			payload: {},
		});

		expect(response.statusCode).toBe(404);
	});
});

describe("/estimate-links/:token", () => {
	it("shows the estimate without internal ids", async () => {
		const ctx = await setup();
		const token = await sendAndGetToken(ctx);

		const response = await app.inject({ url: `/estimate-links/${token}` });

		expect(response.statusCode).toBe(200);
		const data = response.json().data;
		expect(data).toMatchObject({
			number: 1,
			status: "sent",
			expired: false,
			client: { name: "Maria Oliveira" },
			device: { maker: "Apple", model: "iPhone 13" },
			items: [{ name: "Troca de tela", total: 150 }],
			totals: { total: 150 },
		});
		expect(JSON.stringify(data)).not.toContain(ctx.estimateId);
		expect(JSON.stringify(data)).not.toContain(ctx.company.id);
	});

	it("shows the parts a service uses right after it, flagged", async () => {
		const ctx = await setup({ withServicePart: true });
		const token = await sendAndGetToken(ctx);

		const response = await app.inject({ url: `/estimate-links/${token}` });

		const data = response.json().data;
		expect(data.items).toMatchObject([
			{ name: "Troca de tela", nested: false },
			{ name: "Tela OLED", nested: true },
		]);
		expect(data.items[1]).not.toHaveProperty("parentItemId");
		expect(data.totals.total).toBe(1040);
	});

	it("serves the PDF", async () => {
		const ctx = await setup();
		const token = await sendAndGetToken(ctx);

		const response = await app.inject({ url: `/estimate-links/${token}/pdf` });

		expect(response.statusCode).toBe(200);
		expect(response.headers["content-type"]).toBe("application/pdf");
	});

	it("approves the estimate and the service order", async () => {
		const ctx = await setup();
		const token = await sendAndGetToken(ctx);

		const response = await app.inject({
			method: "POST",
			url: `/estimate-links/${token}/approve`,
		});
		const again = await app.inject({
			method: "POST",
			url: `/estimate-links/${token}/reject`,
			payload: {},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toMatchObject({
			code: "approve_estimate_success",
			data: { status: "approved" },
		});
		expect(response.json().data.respondedAt).not.toBeNull();
		expect(await serviceOrderStatus(ctx.serviceOrder.id)).toBe("approved");
		// The customer approved: nobody of the shop moved the order.
		expect(await lastMove(ctx.serviceOrder.id)).toEqual({
			to: "approved",
			employeeId: null,
		});
		expect(again.statusCode).toBe(409);
		expect(again.json().code).toBe("estimate_already_answered");
	});

	it("rejects with a reason and keeps the order waiting", async () => {
		const ctx = await setup();
		const token = await sendAndGetToken(ctx);

		const response = await app.inject({
			method: "POST",
			url: `/estimate-links/${token}/reject`,
			payload: { reason: "Ficou caro" },
		});
		const staffView = await authedInject(app, ctx.token, {
			method: "GET",
			url: `${ctx.base}/${ctx.estimateId}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().data).toMatchObject({
			status: "rejected",
			rejectionReason: "Ficou caro",
		});
		expect(staffView.json().data.rejectionReason).toBe("Ficou caro");
		expect(await serviceOrderStatus(ctx.serviceOrder.id)).toBe(
			"waiting_approval"
		);
	});

	it("does not move an order that is already being fixed", async () => {
		const ctx = await setup();
		const token = await sendAndGetToken(ctx);
		await db
			.update(serviceOrders)
			.set({ status: "fixing" })
			.where(eq(serviceOrders.id, ctx.serviceOrder.id));

		await app.inject({
			method: "POST",
			url: `/estimate-links/${token}/approve`,
		});

		expect(await serviceOrderStatus(ctx.serviceOrder.id)).toBe("fixing");
	});

	it("refuses an expired estimate", async () => {
		const ctx = await setup();
		const token = await sendAndGetToken(ctx);
		await db
			.update(estimates)
			.set({ validUntil: new Date(Date.now() - 60_000) })
			.where(eq(estimates.id, ctx.estimateId));

		const view = await app.inject({ url: `/estimate-links/${token}` });
		const response = await app.inject({
			method: "POST",
			url: `/estimate-links/${token}/approve`,
		});

		expect(view.json().data.expired).toBe(true);
		expect(response.statusCode).toBe(410);
		expect(response.json().code).toBe("estimate_expired");
	});

	it("stops working when the staff takes the estimate back to draft", async () => {
		const ctx = await setup();
		const token = await sendAndGetToken(ctx);

		await authedInject(app, ctx.token, {
			method: "PATCH",
			url: `${ctx.base}/${ctx.estimateId}/status`,
			payload: { status: "draft" },
		});
		const response = await app.inject({ url: `/estimate-links/${token}` });

		expect(response.statusCode).toBe(404);
	});

	it("answers 404 for an unknown token", async () => {
		const response = await app.inject({
			url: `/estimate-links/${"x".repeat(43)}`,
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().code).toBe("estimate_link_invalid");
	});
});
