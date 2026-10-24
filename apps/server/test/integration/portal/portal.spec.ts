import { cookieKey } from "@fixr/constants/cookies";
import { db, eq } from "@fixr/db/connection";
import { serviceOrderItems, serviceOrders } from "@fixr/db/schema";
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
const COOKIE = cookieKey("portalSession");

afterAll(async () => {
	await queue.close();
});

let seq = 0;
/** A CPF-shaped value unique to this run (the portal does not validate digits). */
const uniqueCpf = () =>
	`${Date.now() % 1e9}${String(seq++).padStart(2, "0")}`.slice(-11);

/** A shop (manager) with a client and one service order of that client. */
async function shopWithOrder(client: { cpf: string; email: string | null }) {
	const session = await createEmployeeSession(app, { role: "manager" });
	const [customer, maker, category] = await Promise.all([
		makeCustomer({
			companyId: session.company.id,
			name: "Maria Oliveira",
			cpf: client.cpf,
			email: client.email,
		}),
		makeMaker({ name: "Apple" }),
		makeCategory(),
	]);
	const serviceOrder = await makeServiceOrder({
		companyId: session.company.id,
		clientId: customer.id,
		employeeId: session.employee.id,
		deviceMakerId: maker.id,
		deviceCategoryId: category.id,
		deviceModel: "iPhone 13",
	});
	return { ...session, customer, serviceOrder };
}

type Shop = Awaited<ReturnType<typeof shopWithOrder>>;

function sendAccess(shop: Shop) {
	return authedInject(app, shop.token, {
		method: "POST",
		url: `/companies/${shop.company.subdomain}/clients/${shop.customer.id}/portal-access`,
	});
}

/** Token of the newest portal email queued for `to`. */
async function portalToken(to: string) {
	const jobs = await queue.getJobs(["waiting", "delayed", "prioritized"]);
	const [latest] = jobs
		.filter(
			(job) =>
				job.data.job === "sendPortalAccessEmail" && job.data.payload.to === to
		)
		.sort((a, b) => b.timestamp - a.timestamp);
	const url = (latest?.data.payload as { ctaUrl?: string } | undefined)?.ctaUrl;
	return url?.split("/portal/")[1] ?? "";
}

/** Open a portal session from a link token and return the session cookie. */
async function openSession(token: string, url = "/portal/session") {
	const response = await app.inject({
		method: "POST",
		url,
		payload: { token },
	});
	const cookie = response.cookies.find((c) => c.name === COOKIE);
	return { response, cookie: cookie?.value ?? "" };
}

function portal(cookie: string, url: string, method: "GET" | "POST" = "GET") {
	return app.inject({ method, url, cookies: { [COOKIE]: cookie } });
}

async function signIn(shop: Shop) {
	await sendAccess(shop);
	const email = shop.customer.email ?? "";
	return (await openSession(await portalToken(email))).cookie;
}

describe("shop sends portal access", () => {
	it("emails a link that opens an httpOnly session", async () => {
		const shop = await shopWithOrder({
			cpf: uniqueCpf(),
			email: `maria-${seq}@fixr.test`,
		});

		const sent = await sendAccess(shop);
		const token = await portalToken(shop.customer.email ?? "");
		const { response, cookie } = await openSession(token);

		expect(sent.statusCode).toBe(200);
		expect(sent.json().code).toBe("send_portal_access_success");
		expect(token).toHaveLength(43);
		expect(response.statusCode).toBe(200);
		const setCookie = response.cookies.find((c) => c.name === COOKIE);
		expect(setCookie).toMatchObject({ httpOnly: true, secure: true });
		expect(cookie).not.toBe(token);

		const me = await portal(cookie, "/portal/me");
		expect(me.json().data).toEqual({
			name: "Maria Oliveira",
			email: shop.customer.email,
		});
	});

	it("needs the client's email", async () => {
		const shop = await shopWithOrder({ cpf: uniqueCpf(), email: null });

		const response = await sendAccess(shop);

		expect(response.statusCode).toBe(400);
		expect(response.json().code).toBe("portal_client_no_email");
	});

	it("does not send access to another company's client", async () => {
		const shop = await shopWithOrder({
			cpf: uniqueCpf(),
			email: `x-${seq}@fixr.test`,
		});
		const outsider = await createEmployeeSession(app, { role: "manager" });

		const response = await authedInject(app, outsider.token, {
			method: "POST",
			url: `/companies/${outsider.company.subdomain}/clients/${shop.customer.id}/portal-access`,
		});

		expect(response.statusCode).toBe(404);
	});

	it("revokes the previous link and its sessions when sent again", async () => {
		const shop = await shopWithOrder({
			cpf: uniqueCpf(),
			email: `rot-${seq}@fixr.test`,
		});
		const email = shop.customer.email ?? "";
		await sendAccess(shop);
		const oldToken = await portalToken(email);
		const { cookie: oldCookie } = await openSession(oldToken);

		await sendAccess(shop);
		const reopened = await openSession(oldToken);
		const oldSession = await portal(oldCookie, "/portal/me");
		const fresh = await openSession(await portalToken(email));

		expect(reopened.response.statusCode).toBe(404);
		expect(reopened.response.json().code).toBe("portal_link_invalid");
		expect(oldSession.statusCode).toBe(401);
		expect(fresh.response.statusCode).toBe(200);
	});
});

describe("client portal", () => {
	it("refuses requests without a session", async () => {
		const response = await app.inject({ url: "/portal/service-orders" });
		const forged = await portal(
			"forged-session-token",
			"/portal/service-orders"
		);

		expect(response.statusCode).toBe(401);
		expect(response.json().code).toBe("portal_unauthorized");
		expect(forged.statusCode).toBe(401);
	});

	it("lists the orders of every shop with the same CPF and email only", async () => {
		const cpf = uniqueCpf();
		const email = `multi-${seq}@fixr.test`;
		const shopA = await shopWithOrder({ cpf, email });
		const shopB = await shopWithOrder({ cpf, email: email.toUpperCase() });
		const otherEmail = await shopWithOrder({
			cpf,
			email: `else-${seq}@fixr.test`,
		});
		const otherCpf = await shopWithOrder({ cpf: uniqueCpf(), email });

		const cookie = await signIn(shopA);
		const response = await portal(cookie, "/portal/service-orders");

		expect(response.statusCode).toBe(200);
		const ids = response.json().data.map((order: { id: string }) => order.id);
		expect(ids).toEqual(
			expect.arrayContaining([shopA.serviceOrder.id, shopB.serviceOrder.id])
		);
		expect(ids).not.toContain(otherEmail.serviceOrder.id);
		expect(ids).not.toContain(otherCpf.serviceOrder.id);
		expect(response.json().data[0]).toMatchObject({
			deviceMaker: "Apple",
			deviceModel: "iPhone 13",
			pendingEstimate: false,
		});
	});

	it("shows a service order with its items, without internal notes", async () => {
		const shop = await shopWithOrder({
			cpf: uniqueCpf(),
			email: `det-${seq}@fixr.test`,
		});
		await db
			.update(serviceOrders)
			.set({ observations: "cliente difícil" })
			.where(eq(serviceOrders.id, shop.serviceOrder.id));
		await db.insert(serviceOrderItems).values({
			serviceOrderId: shop.serviceOrder.id,
			type: "service",
			name: "Troca de tela",
			quantity: 1,
			unitPrice: 150,
		});
		const cookie = await signIn(shop);

		const response = await portal(
			cookie,
			`/portal/service-orders/${shop.serviceOrder.id}`
		);

		expect(response.statusCode).toBe(200);
		expect(response.json().data).toMatchObject({
			id: shop.serviceOrder.id,
			company: { name: shop.company.name },
			items: [{ name: "Troca de tela", total: 150 }],
			estimates: [],
		});
		expect(JSON.stringify(response.json())).not.toContain("cliente difícil");
	});

	it("hides service orders outside the client's scope", async () => {
		const shop = await shopWithOrder({
			cpf: uniqueCpf(),
			email: `scope-${seq}@fixr.test`,
		});
		const stranger = await shopWithOrder({
			cpf: uniqueCpf(),
			email: `stranger-${seq}@fixr.test`,
		});
		const cookie = await signIn(shop);

		const response = await portal(
			cookie,
			`/portal/service-orders/${stranger.serviceOrder.id}`
		);

		expect(response.statusCode).toBe(404);
	});

	it("answers estimates and hides drafts", async () => {
		const shop = await shopWithOrder({
			cpf: uniqueCpf(),
			email: `est-${seq}@fixr.test`,
		});
		await db.insert(serviceOrderItems).values({
			serviceOrderId: shop.serviceOrder.id,
			type: "part",
			name: "Tela OLED",
			quantity: 1,
			unitPrice: 500,
		});
		const base = `/companies/${shop.company.subdomain}/estimates`;
		const create = () =>
			authedInject(app, shop.token, {
				method: "POST",
				url: base,
				payload: { serviceOrderId: shop.serviceOrder.id },
			});
		const draft = (await create()).json().data;
		const sent = (await create()).json().data;
		await authedInject(app, shop.token, {
			method: "PATCH",
			url: `${base}/${sent.id}/status`,
			payload: { status: "sent" },
		});
		const cookie = await signIn(shop);

		const detail = await portal(
			cookie,
			`/portal/service-orders/${shop.serviceOrder.id}`
		);
		const draftPdf = await portal(cookie, `/portal/estimates/${draft.id}/pdf`);
		const pdf = await portal(cookie, `/portal/estimates/${sent.id}/pdf`);
		const approved = await portal(
			cookie,
			`/portal/estimates/${sent.id}/approve`,
			"POST"
		);
		const again = await portal(
			cookie,
			`/portal/estimates/${sent.id}/approve`,
			"POST"
		);

		expect(
			detail.json().data.estimates.map((e: { id: string }) => e.id)
		).toEqual([sent.id]);
		expect(detail.json().data.estimates[0].totals.total).toBe(500);
		expect(draftPdf.statusCode).toBe(404);
		expect(pdf.headers["content-type"]).toBe("application/pdf");
		expect(approved.statusCode).toBe(200);
		expect(approved.json().data).toMatchObject({
			status: "approved",
			estimates: [{ id: sent.id, status: "approved" }],
		});
		expect(again.statusCode).toBe(409);
	});

	it("signs out", async () => {
		const shop = await shopWithOrder({
			cpf: uniqueCpf(),
			email: `out-${seq}@fixr.test`,
		});
		const cookie = await signIn(shop);

		const out = await app.inject({
			method: "DELETE",
			url: "/portal/session",
			cookies: { [COOKIE]: cookie },
		});
		const after = await portal(cookie, "/portal/me");

		expect(out.statusCode).toBe(200);
		expect(after.statusCode).toBe(401);
	});
});

describe("portal entry from an estimate link", () => {
	it("uses the email the estimate was sent to as the identity", async () => {
		const shop = await shopWithOrder({
			cpf: uniqueCpf(),
			email: `link-${seq}@fixr.test`,
		});
		await db.insert(serviceOrderItems).values({
			serviceOrderId: shop.serviceOrder.id,
			type: "service",
			name: "Diagnóstico",
			quantity: 1,
			unitPrice: 80,
		});
		const base = `/companies/${shop.company.subdomain}/estimates`;
		const { id } = (
			await authedInject(app, shop.token, {
				method: "POST",
				url: base,
				payload: { serviceOrderId: shop.serviceOrder.id },
			})
		).json().data;
		await authedInject(app, shop.token, {
			method: "POST",
			url: `${base}/${id}/send`,
			payload: {},
		});
		const jobs = await queue.getJobs(["waiting", "delayed", "prioritized"]);
		const job = jobs.find(
			(j) =>
				j.data.job === "sendEstimateEmail" &&
				j.data.payload.to === shop.customer.email
		);
		const ctaUrl = (job?.data.payload as { ctaUrl?: string } | undefined)
			?.ctaUrl;
		const estimateToken = ctaUrl?.split("/estimate/")[1] ?? "";

		const { response, cookie } = await openSession(
			estimateToken,
			"/portal/session/estimate"
		);
		const orders = await portal(cookie, "/portal/service-orders");

		expect(response.statusCode).toBe(200);
		expect(orders.json().data).toEqual([
			expect.objectContaining({
				id: shop.serviceOrder.id,
				pendingEstimate: true,
			}),
		]);
	});

	it("refuses an unknown estimate token", async () => {
		const { response } = await openSession(
			"z".repeat(43),
			"/portal/session/estimate"
		);

		expect(response.statusCode).toBe(404);
	});
});

describe("client asks for a link", () => {
	it("answers the same for unknown and known emails, and emails the known one", async () => {
		const shop = await shopWithOrder({
			cpf: uniqueCpf(),
			email: `self-${seq}@fixr.test`,
		});
		const ask = (email: string) =>
			app.inject({
				method: "POST",
				url: "/portal/access",
				payload: { email, cfTurnstileToken: "ok" },
			});

		const unknown = await ask(`nobody-${seq}@fixr.test`);
		const known = await ask(` ${shop.customer.email?.toUpperCase()} `);
		const { response, cookie } = await openSession(
			await portalToken(shop.customer.email ?? "")
		);
		const orders = await portal(cookie, "/portal/service-orders");

		expect(unknown.statusCode).toBe(202);
		expect(known.statusCode).toBe(202);
		expect(known.json()).toEqual(unknown.json());
		expect(response.statusCode).toBe(200);
		expect(orders.json().data.map((o: { id: string }) => o.id)).toEqual([
			shop.serviceOrder.id,
		]);
	});
});
