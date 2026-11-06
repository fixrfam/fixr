import { APP_NAME } from "@fixr/constants/app";
import { env } from "@fixr/env/server";
import type { Locale } from "@fixr/i18n";
import { createEmailQueue, queueEmail } from "@fixr/mail/queue";
import type { jwtPayload } from "@fixr/schemas/auth";
import { formatServiceOrderCode } from "@fixr/schemas/service-orders";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { redis } from "../../../config/redis";
import { AppError } from "../../../core/lib/app-error";
import { inReadingOrder } from "../../../core/lib/item-order";
import { withModelImageUrl } from "../../../core/lib/model-image";
import { estimateTotals, lineTotal } from "../../../core/lib/money";
import {
	generateOpaqueToken,
	hashOpaqueToken,
} from "../../../core/lib/opaque-token";
import { apiResponse } from "../../../core/lib/response";
import { PORTAL_SESSION_COOKIE } from "../../../core/middlewares/authenticate-portal";
import { EstimatesRepository } from "../../estimates/repositories";
import { EstimatesService } from "../../estimates/services";
import { type PortalIdentity, PortalRepository } from "../repositories";

type UserJwt = z.infer<typeof jwtPayload>;

/** How long a browser stays signed in to the portal after opening a link. */
const SESSION_DAYS = 30;
/**
 * How long an emailed portal link keeps signing people in. It can be opened
 * many times (from the phone, then the computer) until then.
 */
export const LINK_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const portalUrl = (token: string) => `${env.FRONTEND_URL}/portal/${token}`;

function sessionCookieOptions(expires: Date) {
	return {
		httpOnly: true,
		expires,
		path: "/",
		sameSite: "none" as const,
		secure: true,
		domain: env.COOKIE_DOMAIN,
	};
}

/** @description Business logic for the client portal */
export class PortalService {
	/** Sign the browser in with the identity of a link and set the cookie. */
	private static async openSession(
		response: FastifyReply,
		identity: PortalIdentity & { portalLinkId: string | null },
		/** Where the portal should land, e.g. the estimate the link was for. */
		landing: { estimateId: string } | null = null
	) {
		const token = generateOpaqueToken();
		const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY_MS);
		await PortalRepository.insertSession({
			tokenHash: hashOpaqueToken(token),
			portalLinkId: identity.portalLinkId,
			cpf: identity.cpf,
			email: identity.email,
			clientId: identity.clientId,
			expiresAt,
		});

		return response
			.setCookie(PORTAL_SESSION_COOKIE, token, sessionCookieOptions(expiresAt))
			.status(200)
			.send(
				apiResponse({
					status: 200,
					error: null,
					code: "portal_session_opened",
					message: "Portal session opened.",
					data: landing,
				})
			);
	}

	/** Open a session from a portal link (the client's account). */
	static async openFromPortalLink({
		token,
		response,
	}: {
		token: string;
		response: FastifyReply;
	}) {
		const link = await PortalRepository.queryActiveLink(
			hashOpaqueToken(token),
			new Date(Date.now() - LINK_DAYS * DAY_MS)
		);
		if (!link) {
			throw new AppError("PORTAL_LINK_INVALID");
		}
		await PortalRepository.touchLink(link.id);

		return PortalService.openSession(response, {
			cpf: link.cpf,
			email: link.email,
			clientId: link.clientId,
			portalLinkId: link.id,
		});
	}

	/**
	 * Open a session from an estimate link. The estimate email proves the
	 * person reads `sent_to`, so that is the identity's email.
	 */
	static async openFromEstimateLink({
		token,
		response,
	}: {
		token: string;
		response: FastifyReply;
	}) {
		const estimate = await EstimatesRepository.queryByTokenHash(
			hashOpaqueToken(token)
		);
		const client = estimate?.clientId
			? await PortalRepository.queryClient(estimate.clientId)
			: null;
		if (!(estimate?.sentTo && client) || client.deletedAt) {
			throw new AppError("PORTAL_LINK_INVALID");
		}

		return PortalService.openSession(
			response,
			{
				cpf: client.cpf,
				email: normalizeEmail(estimate.sentTo),
				clientId: client.id,
				portalLinkId: null,
			},
			{ estimateId: estimate.id }
		);
	}

	static async signOut({
		token,
		response,
	}: {
		token: string | undefined;
		response: FastifyReply;
	}) {
		if (token) {
			await PortalRepository.deleteSession(hashOpaqueToken(token));
		}

		return response
			.clearCookie(PORTAL_SESSION_COOKIE, sessionCookieOptions(new Date(0)))
			.status(200)
			.send(
				apiResponse({
					status: 200,
					error: null,
					code: "portal_signed_out",
					message: "Signed out of the portal.",
					data: null,
				})
			);
	}

	/**
	 * Email a new portal link to whoever is registered with this email, one per
	 * CPF. The answer is the same whether or not the email exists, so the route
	 * can't be used to find out who is a client.
	 */
	static async requestAccess({
		email,
		locale,
		response,
	}: {
		email: string;
		locale: Locale;
		response: FastifyReply;
	}) {
		await PortalService.sendLinksTo(normalizeEmail(email), locale);

		return response.status(202).send(
			apiResponse({
				status: 202,
				error: null,
				code: "portal_access_requested",
				message: "If the email is registered, a link was sent.",
				data: null,
			})
		);
	}

	/** One new portal link per CPF registered with the email, by email. */
	private static async sendLinksTo(normalized: string, locale: Locale) {
		const records = await PortalRepository.queryClientsByEmail(normalized);

		const byCpf = new Map<string, string>();
		for (const record of records) {
			if (!byCpf.has(record.cpf)) {
				byCpf.set(record.cpf, record.name);
			}
		}

		const queue = createEmailQueue(redis);
		for (const [cpf, name] of byCpf) {
			const token = generateOpaqueToken();
			await PortalRepository.insertLink({
				tokenHash: hashOpaqueToken(token),
				cpf,
				email: normalized,
			});
			await queueEmail(queue, {
				job: "sendPortalAccessEmail",
				payload: {
					to: normalized,
					appName: APP_NAME,
					locale,
					clientName: name,
					companyName: null,
					ctaUrl: portalUrl(token),
				},
			});
		}
		return byCpf.size;
	}

	/**
	 * Whether the signed-in user's email is also a client's in some shop, so
	 * the login can offer the portal next to the company.
	 */
	static async employeePortalMatch({
		userJwt,
		response,
	}: {
		userJwt: UserJwt;
		response: FastifyReply;
	}) {
		const records = await PortalRepository.queryClientsByEmail(
			normalizeEmail(userJwt.email)
		);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "portal_employee_match_success",
				message: "Portal match checked.",
				data: { customer: records.length > 0 },
			})
		);
	}

	/**
	 * Email portal links to the signed-in user. The password proves the
	 * account, not the inbox, so the portal is still opened from the email.
	 */
	static async employeePortalAccess({
		userJwt,
		locale,
		response,
	}: {
		userJwt: UserJwt;
		locale: Locale;
		response: FastifyReply;
	}) {
		await PortalService.sendLinksTo(normalizeEmail(userJwt.email), locale);

		return response.status(202).send(
			apiResponse({
				status: 202,
				error: null,
				code: "portal_access_requested",
				message: "If the email is registered, a link was sent.",
				data: null,
			})
		);
	}

	/**
	 * A shop emails portal access to one of its clients. The shop's previous
	 * links for that client stop working (and the sessions opened from them).
	 */
	static async sendAccess({
		userJwt,
		subdomain,
		clientId,
		locale,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		clientId: string;
		locale: Locale;
		response: FastifyReply;
	}) {
		if (!userJwt.company) {
			throw new AppError("PORTAL_COMPANY_NOT_FOUND");
		}
		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("PORTAL_NOT_ALLOWED");
		}
		const companyId = userJwt.company.id;

		const client = await PortalRepository.queryClient(clientId);
		if (!client || client.companyId !== companyId || client.deletedAt) {
			throw new AppError("PORTAL_CLIENT_NOT_FOUND");
		}
		if (!client.email) {
			throw new AppError("PORTAL_CLIENT_NO_EMAIL");
		}

		const email = normalizeEmail(client.email);
		const token = generateOpaqueToken();
		await PortalRepository.revokeShopLinks(client.id, companyId);
		await PortalRepository.insertLink({
			tokenHash: hashOpaqueToken(token),
			cpf: client.cpf,
			email,
			companyId,
			clientId: client.id,
		});
		await queueEmail(createEmailQueue(redis), {
			job: "sendPortalAccessEmail",
			payload: {
				to: email,
				appName: APP_NAME,
				locale,
				clientName: client.name,
				companyName: userJwt.company.name,
				ctaUrl: portalUrl(token),
			},
		});

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "send_portal_access_success",
				message: "Portal access sent to the client.",
				data: null,
			})
		);
	}

	private static async scope(identity: PortalIdentity) {
		const clients = await PortalRepository.queryScopeClients(identity);
		return { clients, clientIds: clients.map((client) => client.id) };
	}

	static async me({
		identity,
		response,
	}: {
		identity: PortalIdentity;
		response: FastifyReply;
	}) {
		const { clients, clientIds } = await PortalService.scope(identity);
		const shops = await PortalRepository.queryScopeCompanies(clientIds);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "portal_me_success",
				message: "Portal profile retrieved.",
				data: {
					name: clients[0]?.name ?? null,
					email: identity.email,
					cpf: identity.cpf,
					shops: shops.map(({ id: _id, ...shop }) => shop),
				},
			})
		);
	}

	static async listServiceOrders({
		identity,
		response,
	}: {
		identity: PortalIdentity;
		response: FastifyReply;
	}) {
		const { clientIds } = await PortalService.scope(identity);
		const rows = await PortalRepository.queryServiceOrders(clientIds);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "portal_service_orders_success",
				message: "Service orders retrieved.",
				data: await Promise.all(
					rows.map(async ({ number, subdomain, ...row }) => {
						const { model, ...summary } = await withModelImageUrl(row);
						return {
							...summary,
							deviceImageUrl: model.imageUrl,
							code: formatServiceOrderCode(subdomain, number),
							pendingEstimate: Boolean(Number(row.pendingEstimate)),
						};
					})
				),
			})
		);
	}

	private static async serviceOrderDetail(
		serviceOrderId: string,
		clientIds: string[]
	) {
		const serviceOrder = await PortalRepository.queryServiceOrder(
			serviceOrderId,
			clientIds
		);
		if (!serviceOrder) {
			throw new AppError("PORTAL_SERVICE_ORDER_NOT_FOUND");
		}

		const [items, estimateRows, history, withImage] = await Promise.all([
			PortalRepository.queryServiceOrderItems(serviceOrder.id),
			PortalRepository.queryServiceOrderEstimates(serviceOrder.id),
			PortalRepository.queryServiceOrderHistory(serviceOrder.id),
			withModelImageUrl(serviceOrder),
		]);
		const estimateItems = await EstimatesRepository.queryItemsByEstimateIds(
			estimateRows.map((row) => row.id)
		);
		const now = Date.now();
		const {
			companyId: _companyId,
			number,
			subdomain,
			model,
			...rest
		} = withImage;

		return {
			...rest,
			deviceImageUrl: model.imageUrl,
			code: formatServiceOrderCode(subdomain, number),
			history,
			// Reading order, the parts of a service flagged to show under it; the
			// order's internal ids stay out of the portal.
			items: inReadingOrder(items).map(
				({ item: { id: _id, parentItemId: _parent, ...item }, nested }) => ({
					...item,
					nested,
					total: lineTotal(item),
				})
			),
			estimates: estimateRows.map((row) => ({
				...row,
				expired: row.validUntil.getTime() < now,
				totals: estimateTotals(
					estimateItems.get(row.id) ?? [],
					row.discountPercentage
				),
			})),
		};
	}

	static async getServiceOrder({
		identity,
		serviceOrderId,
		response,
	}: {
		identity: PortalIdentity;
		serviceOrderId: string;
		response: FastifyReply;
	}) {
		const { clientIds } = await PortalService.scope(identity);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "portal_service_order_success",
				message: "Service order retrieved.",
				data: await PortalService.serviceOrderDetail(serviceOrderId, clientIds),
			})
		);
	}

	private static async ownEstimate(
		identity: PortalIdentity,
		estimateId: string
	) {
		const { clientIds } = await PortalService.scope(identity);
		const estimate = await PortalRepository.queryEstimate(
			estimateId,
			clientIds
		);
		if (!estimate) {
			throw new AppError("PORTAL_ESTIMATE_NOT_FOUND");
		}
		return { estimate, clientIds };
	}

	static async getEstimatePdf({
		identity,
		estimateId,
		locale,
		response,
	}: {
		identity: PortalIdentity;
		estimateId: string;
		locale: Locale;
		response: FastifyReply;
	}) {
		const { estimate } = await PortalService.ownEstimate(identity, estimateId);
		const { pdf, fileName } = await EstimatesService.buildPdf(
			estimate.id,
			estimate.companyId,
			locale
		);

		return response
			.status(200)
			.header("Content-Type", "application/pdf")
			.header("Content-Disposition", `inline; filename="${fileName}"`)
			.send(pdf);
	}

	/** The client answers an estimate from the portal (same rules as the link). */
	static async answerEstimate({
		identity,
		estimateId,
		answer,
		response,
	}: {
		identity: PortalIdentity;
		estimateId: string;
		answer: { status: "approved" } | { status: "rejected"; reason?: string };
		response: FastifyReply;
	}) {
		const { estimate } = await PortalService.ownEstimate(identity, estimateId);
		if (estimate.status !== "sent") {
			throw new AppError("ESTIMATE_ALREADY_ANSWERED");
		}
		if (estimate.validUntil.getTime() < Date.now()) {
			throw new AppError("ESTIMATE_EXPIRED");
		}

		const recorded = await EstimatesService.recordAnswer(
			estimate,
			answer.status === "approved"
				? answer
				: { status: "rejected", rejectionReason: answer.reason || null },
			// The customer answered: nobody of the shop moved the order.
			null
		);
		if (!recorded) {
			throw new AppError("ESTIMATE_ALREADY_ANSWERED");
		}

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code:
					answer.status === "approved"
						? "approve_estimate_success"
						: "reject_estimate_success",
				message: "Answer recorded.",
				data: await PortalService.estimateView(estimate),
			})
		);
	}

	/** The estimate as the client sees it, with the ids the portal links by. */
	private static async estimateView(estimate: {
		id: string;
		companyId: string;
		serviceOrderId: string;
	}) {
		const row = await EstimatesRepository.queryEstimate(
			estimate.id,
			estimate.companyId
		);
		if (!row) {
			throw new AppError("PORTAL_ESTIMATE_NOT_FOUND");
		}
		return {
			id: estimate.id,
			serviceOrderId: estimate.serviceOrderId,
			...(await EstimatesService.customerView(row)),
		};
	}

	static async listEstimates({
		identity,
		response,
	}: {
		identity: PortalIdentity;
		response: FastifyReply;
	}) {
		const { clientIds } = await PortalService.scope(identity);
		const rows = await PortalRepository.queryEstimates(clientIds);
		const items = await EstimatesRepository.queryItemsByEstimateIds(
			rows.map((row) => row.id)
		);
		const now = Date.now();

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "portal_estimates_success",
				message: "Estimates retrieved.",
				data: await Promise.all(
					rows.map(async (row) => {
						const {
							serviceOrderNumber,
							subdomain,
							model,
							discountPercentage,
							...estimate
						} = await withModelImageUrl(row);
						return {
							...estimate,
							serviceOrderCode: formatServiceOrderCode(
								subdomain,
								serviceOrderNumber
							),
							deviceImageUrl: model.imageUrl,
							expired: row.validUntil.getTime() < now,
							totals: estimateTotals(
								items.get(row.id) ?? [],
								discountPercentage
							),
						};
					})
				),
			})
		);
	}

	static async getEstimate({
		identity,
		estimateId,
		response,
	}: {
		identity: PortalIdentity;
		estimateId: string;
		response: FastifyReply;
	}) {
		const { estimate } = await PortalService.ownEstimate(identity, estimateId);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "portal_estimate_success",
				message: "Estimate retrieved.",
				data: await PortalService.estimateView(estimate),
			})
		);
	}
}
