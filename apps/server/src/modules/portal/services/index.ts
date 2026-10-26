import { APP_NAME } from "@fixr/constants/app";
import { env } from "@fixr/env/server";
import type { Locale } from "@fixr/i18n";
import { createEmailQueue, queueEmail } from "@fixr/mail/queue";
import type { jwtPayload } from "@fixr/schemas/auth";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { redis } from "../../../config/redis";
import { AppError } from "../../../core/lib/app-error";
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

/** @description Business logic for the customer portal */
export class PortalService {
	/** Sign the browser in with the identity of a link and set the cookie. */
	private static async openSession(
		response: FastifyReply,
		identity: PortalIdentity & { portalLinkId: string | null }
	) {
		const token = generateOpaqueToken();
		const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY_MS);
		await PortalRepository.insertSession({
			tokenHash: hashOpaqueToken(token),
			portalLinkId: identity.portalLinkId,
			cpf: identity.cpf,
			email: identity.email,
			customerId: identity.customerId,
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
					data: null,
				})
			);
	}

	/** Open a session from a portal link (the customer's account). */
	static async openFromPortalLink({
		token,
		response,
	}: {
		token: string;
		response: FastifyReply;
	}) {
		const link = await PortalRepository.queryActiveLink(hashOpaqueToken(token));
		if (!link) {
			throw new AppError("PORTAL_LINK_INVALID");
		}
		await PortalRepository.touchLink(link.id);

		return PortalService.openSession(response, {
			cpf: link.cpf,
			email: link.email,
			customerId: link.customerId,
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
		const customer = estimate?.customerId
			? await PortalRepository.queryCustomer(estimate.customerId)
			: null;
		if (!(estimate?.sentTo && customer) || customer.deletedAt) {
			throw new AppError("PORTAL_LINK_INVALID");
		}

		return PortalService.openSession(response, {
			cpf: customer.cpf,
			email: normalizeEmail(estimate.sentTo),
			customerId: customer.id,
			portalLinkId: null,
		});
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
	 * can't be used to find out who is a customer.
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
		const normalized = normalizeEmail(email);
		const records = await PortalRepository.queryCustomersByEmail(normalized);

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
					customerName: name,
					companyName: null,
					ctaUrl: portalUrl(token),
				},
			});
		}

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
	 * A shop emails portal access to one of its customers. The shop's previous
	 * links for that customer stop working (and the sessions opened from them).
	 */
	static async sendAccess({
		userJwt,
		subdomain,
		customerId,
		locale,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		customerId: string;
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

		const customer = await PortalRepository.queryCustomer(customerId);
		if (!customer || customer.companyId !== companyId || customer.deletedAt) {
			throw new AppError("PORTAL_CUSTOMER_NOT_FOUND");
		}
		if (!customer.email) {
			throw new AppError("PORTAL_CUSTOMER_NO_EMAIL");
		}

		const email = normalizeEmail(customer.email);
		const token = generateOpaqueToken();
		await PortalRepository.revokeShopLinks(customer.id, companyId);
		await PortalRepository.insertLink({
			tokenHash: hashOpaqueToken(token),
			cpf: customer.cpf,
			email,
			companyId,
			customerId: customer.id,
		});
		await queueEmail(createEmailQueue(redis), {
			job: "sendPortalAccessEmail",
			payload: {
				to: email,
				appName: APP_NAME,
				locale,
				customerName: customer.name,
				companyName: userJwt.company.name,
				ctaUrl: portalUrl(token),
			},
		});

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "send_portal_access_success",
				message: "Portal access sent to the customer.",
				data: null,
			})
		);
	}

	private static async scope(identity: PortalIdentity) {
		const customers = await PortalRepository.queryScopeCustomers(identity);
		return { customers, customerIds: customers.map((customer) => customer.id) };
	}

	static async me({
		identity,
		response,
	}: {
		identity: PortalIdentity;
		response: FastifyReply;
	}) {
		const { customers } = await PortalService.scope(identity);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "portal_me_success",
				message: "Portal profile retrieved.",
				data: { name: customers[0]?.name ?? null, email: identity.email },
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
		const { customerIds } = await PortalService.scope(identity);
		const rows = await PortalRepository.queryServiceOrders(customerIds);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "portal_service_orders_success",
				message: "Service orders retrieved.",
				data: rows.map((row) => ({
					...row,
					pendingEstimate: Boolean(Number(row.pendingEstimate)),
				})),
			})
		);
	}

	private static async serviceOrderDetail(
		serviceOrderId: string,
		customerIds: string[]
	) {
		const serviceOrder = await PortalRepository.queryServiceOrder(
			serviceOrderId,
			customerIds
		);
		if (!serviceOrder) {
			throw new AppError("PORTAL_SERVICE_ORDER_NOT_FOUND");
		}

		const [items, estimateRows] = await Promise.all([
			PortalRepository.queryServiceOrderItems(serviceOrder.id),
			PortalRepository.queryServiceOrderEstimates(serviceOrder.id),
		]);
		const estimateItems = await EstimatesRepository.queryItemsByEstimateIds(
			estimateRows.map((row) => row.id)
		);
		const now = Date.now();
		const { companyId: _companyId, ...rest } = serviceOrder;

		return {
			...rest,
			items: items.map((item) => ({ ...item, total: lineTotal(item) })),
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
		const { customerIds } = await PortalService.scope(identity);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "portal_service_order_success",
				message: "Service order retrieved.",
				data: await PortalService.serviceOrderDetail(
					serviceOrderId,
					customerIds
				),
			})
		);
	}

	private static async ownEstimate(
		identity: PortalIdentity,
		estimateId: string
	) {
		const { customerIds } = await PortalService.scope(identity);
		const estimate = await PortalRepository.queryEstimate(
			estimateId,
			customerIds
		);
		if (!estimate) {
			throw new AppError("PORTAL_ESTIMATE_NOT_FOUND");
		}
		return { estimate, customerIds };
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

	/** The customer answers an estimate from the portal (same rules as the link). */
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
		const { estimate, customerIds } = await PortalService.ownEstimate(
			identity,
			estimateId
		);
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
				: { status: "rejected", rejectionReason: answer.reason || null }
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
				data: await PortalService.serviceOrderDetail(
					estimate.serviceOrderId,
					customerIds
				),
			})
		);
	}
}
