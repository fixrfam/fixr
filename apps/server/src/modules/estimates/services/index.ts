import { APP_NAME } from "@fixr/constants/app";
import { asc, desc } from "@fixr/db/connection";
import { estimates } from "@fixr/db/schema";
import { env } from "@fixr/env/server";
import type { Locale } from "@fixr/i18n";
import { createTranslator } from "@fixr/i18n";
import { createEmailQueue, queueEmail } from "@fixr/mail/queue";
import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	createEstimateSchema,
	estimateStatuses,
	getEstimatesQuerySchema,
	patchEstimateSchema,
} from "@fixr/schemas/estimates";
import { formatServiceOrderCode } from "@fixr/schemas/service-orders";
import { createId } from "@paralleldrive/cuid2";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { redis } from "../../../config/redis";
import { events } from "../../../core/events";
import { AppError } from "../../../core/lib/app-error";
import { inReadingOrder } from "../../../core/lib/item-order";
import { estimateTotals, lineTotal } from "../../../core/lib/money";
import {
	generateOpaqueToken,
	hashOpaqueToken,
} from "../../../core/lib/opaque-token";
import {
	getPaginatedCount,
	getPaginatedRecords,
	paginationMeta,
} from "../../../core/lib/pagination";
import { apiResponse, paginatedData } from "../../../core/lib/response";
import { inTransaction } from "../../../core/lib/transaction";
import { fetchLogo, renderEstimatePdf } from "../pdf/render";
import {
	type EstimateItemRow,
	EstimatesRepository,
	estimatesListJoins,
	estimatesListSelect,
} from "../repositories";

type UserJwt = z.infer<typeof jwtPayload>;
type EstimateStatus = z.infer<typeof estimateStatuses>;
type EstimateRow = Awaited<
	ReturnType<typeof EstimatesRepository.queryEstimate>
> & {};

/** Days an estimate stays valid when no date is given. */
const DEFAULT_VALIDITY_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Statuses an estimate can move to from each status. */
const TRANSITIONS: Record<EstimateStatus, EstimateStatus[]> = {
	draft: ["sent"],
	sent: ["approved", "rejected", "draft"],
	approved: [],
	rejected: ["draft"],
};

function isExpired(estimate: { validUntil: Date }) {
	return estimate.validUntil.getTime() < Date.now();
}

/**
 * The order's items as estimate items: each service followed by the parts it
 * uses (kept under it through new ids), so `position` is the reading order.
 */
function copyItems(
	items: Awaited<ReturnType<typeof EstimatesRepository.queryServiceOrderItems>>
) {
	const newIds = new Map(items.map((item) => [item.id, createId()]));

	return inReadingOrder(items).map(({ item, nested }) => ({
		id: newIds.get(item.id),
		parentItemId: nested ? (newIds.get(item.parentItemId ?? "") ?? null) : null,
		type: item.type,
		partId: item.partId,
		serviceId: item.serviceId,
		name: item.name,
		quantity: item.quantity,
		unitPrice: item.unitPrice,
	}));
}

function toRecord(row: EstimateRow, items: EstimateItemRow[]) {
	const { clientName, ...estimate } = row;
	return {
		...estimate,
		client:
			estimate.clientId && clientName
				? { id: estimate.clientId, name: clientName }
				: null,
		totals: estimateTotals(items, estimate.discountPercentage),
	};
}

function withItems(row: EstimateRow, items: EstimateItemRow[]) {
	return {
		...toRecord(row, items),
		items: items.map((item) => ({ ...item, total: lineTotal(item) })),
	};
}

/** @description Business logic for estimates (orçamentos) */
export class EstimatesService {
	/** Resolve the caller's company, refusing a subdomain that isn't theirs. */
	private static resolveCompanyId(userJwt: UserJwt, subdomain: string) {
		if (!userJwt.company) {
			throw new AppError("ESTIMATE_COMPANY_NOT_FOUND");
		}
		if (userJwt.company.subdomain !== subdomain) {
			throw new AppError("ESTIMATE_NOT_ALLOWED");
		}
		return userJwt.company.id;
	}

	private static async queryOwnEstimate(estimateId: string, companyId: string) {
		const estimate = await EstimatesRepository.queryEstimate(
			estimateId,
			companyId
		);
		if (!estimate) {
			throw new AppError("ESTIMATE_NOT_FOUND");
		}
		return estimate;
	}

	private static async detail(estimateId: string, companyId: string) {
		const estimate = await EstimatesService.queryOwnEstimate(
			estimateId,
			companyId
		);
		const items = await EstimatesRepository.queryItemsByEstimateIds([
			estimateId,
		]);
		return withItems(estimate, items.get(estimateId) ?? []);
	}

	static async listEstimates({
		userJwt,
		subdomain,
		page,
		perPage,
		query,
		sort,
		status,
		serviceOrderId,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		response: FastifyReply;
	} & z.infer<typeof getEstimatesQuerySchema>) {
		const companyId = EstimatesService.resolveCompanyId(userJwt, subdomain);
		const PER_PAGE = perPage ?? 10;
		const filter = EstimatesRepository.buildListFilter(companyId, {
			query,
			status,
			serviceOrderId,
		});

		const [rows, totalRecords] = await Promise.all([
			getPaginatedRecords({
				table: estimates,
				select: estimatesListSelect,
				skip: (page - 1) * PER_PAGE,
				take: PER_PAGE,
				where: filter,
				order:
					sort === "older" ? asc(estimates.number) : desc(estimates.number),
				joins: estimatesListJoins,
			}) as Promise<EstimateRow[]>,
			getPaginatedCount({
				table: estimates,
				where: filter,
				joins: estimatesListJoins,
			}),
		]);

		const pagination = paginationMeta({
			page,
			perPage: PER_PAGE,
			totalRecords,
			recordsOnPage: rows.length,
		});
		if (!pagination) {
			throw new AppError("ESTIMATE_PAGE_OUT_OF_BOUNDS");
		}

		const items = await EstimatesRepository.queryItemsByEstimateIds(
			rows.map((row) => row.id)
		);
		const records = rows.map((row) => toRecord(row, items.get(row.id) ?? []));

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "list_estimates_success",
				message: "Estimates retrieved successfully.",
				data: paginatedData({ records, pagination }),
			})
		);
	}

	static async getEstimate({
		userJwt,
		subdomain,
		estimateId,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		estimateId: string;
		response: FastifyReply;
	}) {
		const companyId = EstimatesService.resolveCompanyId(userJwt, subdomain);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "get_estimate_success",
				message: "Estimate retrieved successfully.",
				data: await EstimatesService.detail(estimateId, companyId),
			})
		);
	}

	/** Create an estimate from a service order, copying its items as they are now. */
	static async createEstimate({
		userJwt,
		subdomain,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		data: z.infer<typeof createEstimateSchema>;
		response: FastifyReply;
	}) {
		const companyId = EstimatesService.resolveCompanyId(userJwt, subdomain);

		const serviceOrder = await EstimatesRepository.queryServiceOrderOfCompany(
			data.serviceOrderId,
			companyId
		);
		if (!serviceOrder) {
			throw new AppError("ESTIMATE_SERVICE_ORDER_NOT_FOUND");
		}

		const items = await EstimatesRepository.queryServiceOrderItems(
			serviceOrder.id
		);
		if (items.length === 0) {
			throw new AppError("ESTIMATE_SERVICE_ORDER_EMPTY");
		}

		const employee = await EstimatesRepository.queryEmployee(
			userJwt.id,
			companyId
		);

		const estimateId = await EstimatesRepository.createWithItems(
			{
				companyId,
				serviceOrderId: serviceOrder.id,
				clientId: serviceOrder.clientId,
				createdBy: employee?.id ?? null,
				discountPercentage: data.discountPercentage ?? 0,
				validUntil:
					data.validUntil ??
					new Date(Date.now() + DEFAULT_VALIDITY_DAYS * DAY_MS),
				notes: data.notes ?? null,
			},
			copyItems(items)
		);

		return response.status(201).send(
			apiResponse({
				status: 201,
				error: null,
				code: "create_estimate_success",
				message: "Estimate created successfully.",
				data: await EstimatesService.detail(estimateId, companyId),
			})
		);
	}

	static async patchEstimate({
		userJwt,
		subdomain,
		estimateId,
		data,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		estimateId: string;
		data: z.infer<typeof patchEstimateSchema>;
		response: FastifyReply;
	}) {
		const companyId = EstimatesService.resolveCompanyId(userJwt, subdomain);
		const estimate = await EstimatesService.queryOwnEstimate(
			estimateId,
			companyId
		);
		if (estimate.status !== "draft") {
			throw new AppError("ESTIMATE_NOT_EDITABLE");
		}

		if (Object.keys(data).length > 0) {
			await EstimatesRepository.updateEstimate(estimateId, data);
		}

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "patch_estimate_success",
				message: "Estimate updated successfully.",
				data: await EstimatesService.detail(estimateId, companyId),
			})
		);
	}

	/**
	 * Move the estimate along its lifecycle: draft -> sent -> approved |
	 * rejected. A sent or rejected estimate can go back to draft to be revised.
	 */
	static async updateStatus({
		userJwt,
		subdomain,
		estimateId,
		status,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		estimateId: string;
		status: EstimateStatus;
		response: FastifyReply;
	}) {
		const companyId = EstimatesService.resolveCompanyId(userJwt, subdomain);
		const estimate = await EstimatesService.queryOwnEstimate(
			estimateId,
			companyId
		);

		if (!TRANSITIONS[estimate.status].includes(status)) {
			throw new AppError("ESTIMATE_INVALID_TRANSITION", {
				from: estimate.status,
				to: status,
			});
		}

		const employee = await EstimatesRepository.queryEmployee(
			userJwt.id,
			companyId
		);
		await EstimatesService.applyStatus(estimate, status, employee?.id ?? null);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "update_estimate_status_success",
				message: "Estimate status updated successfully.",
				data: await EstimatesService.detail(estimateId, companyId),
			})
		);
	}

	/** Mark the estimate as sent and announce it: the service order waits for approval. */
	private static markSent(
		estimate: Pick<EstimateRow, "id" | "serviceOrderId" | "companyId">,
		values: { publicTokenHash: string | null; sentTo: string | null },
		employeeId: string | null
	) {
		return inTransaction(async (tx) => {
			await EstimatesRepository.markSent(tx, estimate.id, values);
			await events.emit(tx, "estimate.sent", {
				estimateId: estimate.id,
				serviceOrderId: estimate.serviceOrderId,
				companyId: estimate.companyId,
				employeeId,
			});
		});
	}

	/**
	 * Record the customer's answer and, for an approval, announce it: the
	 * service order is approved.
	 *
	 * The one way to answer an estimate (staff, the emailed link or the portal).
	 *
	 * @returns whether the answer was recorded (only a sent estimate is answered)
	 */
	static recordAnswer(
		estimate: Pick<EstimateRow, "id" | "serviceOrderId" | "companyId">,
		answer:
			| { status: "approved" }
			| { status: "rejected"; rejectionReason: string | null },
		employeeId: string | null
	) {
		return inTransaction(async (tx) => {
			const recorded = await EstimatesRepository.recordAnswer(
				tx,
				estimate.id,
				answer
			);
			if (recorded && answer.status === "approved") {
				await events.emit(tx, "estimate.approved", {
					estimateId: estimate.id,
					serviceOrderId: estimate.serviceOrderId,
					companyId: estimate.companyId,
					employeeId,
				});
			}
			return recorded;
		});
	}

	/**
	 * Staff-side status change. It has the same effects on the service order as
	 * the client's link, and going back to draft disables the link.
	 */
	private static async applyStatus(
		estimate: EstimateRow,
		status: EstimateStatus,
		employeeId: string | null
	) {
		if (status === "draft") {
			await EstimatesRepository.updateEstimate(estimate.id, {
				status,
				publicTokenHash: null,
			});
			return;
		}
		if (status === "sent") {
			await EstimatesService.markSent(
				estimate,
				{ publicTokenHash: null, sentTo: null },
				employeeId
			);
			return;
		}

		const recorded = await EstimatesService.recordAnswer(
			estimate,
			status === "approved" ? { status } : { status, rejectionReason: null },
			employeeId
		);
		if (!recorded) {
			throw new AppError("ESTIMATE_INVALID_TRANSITION", {
				from: estimate.status,
				to: status,
			});
		}
	}

	/**
	 * Email the estimate to the client with the PDF attached and a public link
	 * to approve or reject it. Sending again issues a new link and the previous
	 * one stops working.
	 */
	static async sendEstimate({
		userJwt,
		subdomain,
		estimateId,
		email,
		locale,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		estimateId: string;
		email?: string;
		locale: Locale;
		response: FastifyReply;
	}) {
		const companyId = EstimatesService.resolveCompanyId(userJwt, subdomain);
		const estimate = await EstimatesService.queryOwnEstimate(
			estimateId,
			companyId
		);

		// A draft is sent for the first time; a sent one can be sent again.
		if (estimate.status !== "draft" && estimate.status !== "sent") {
			throw new AppError("ESTIMATE_INVALID_TRANSITION", {
				from: estimate.status,
				to: "sent",
			});
		}
		if (isExpired(estimate)) {
			throw new AppError("ESTIMATE_EXPIRED");
		}

		const { pdf, fileName, detail, context, client } =
			await EstimatesService.buildPdf(estimateId, companyId, locale);

		const recipient = email || client?.email;
		if (!recipient) {
			throw new AppError("ESTIMATE_NO_RECIPIENT");
		}

		const token = generateOpaqueToken();
		const employee = await EstimatesRepository.queryEmployee(
			userJwt.id,
			companyId
		);
		await EstimatesService.markSent(
			estimate,
			{ publicTokenHash: hashOpaqueToken(token), sentTo: recipient },
			employee?.id ?? null
		);

		const { format } = createTranslator(locale);
		await queueEmail(createEmailQueue(redis), {
			job: "sendEstimateEmail",
			payload: {
				to: recipient,
				appName: APP_NAME,
				locale,
				clientName: client?.name ?? recipient,
				companyName: context.company.name,
				number: String(detail.number).padStart(4, "0"),
				device: `${context.device.maker} ${context.device.model}`,
				total: format.currency(detail.totals.total),
				validUntil: format.date(detail.validUntil),
				ctaUrl: `${env.FRONTEND_URL}/estimate/${token}`,
				attachment: { fileName, contentBase64: pdf.toString("base64") },
			},
		});

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "send_estimate_success",
				message: "Estimate sent to the client.",
				data: await EstimatesService.detail(estimateId, companyId),
			})
		);
	}

	/** Estimate behind a public link, or an error when the link is not valid. */
	private static async queryByToken(token: string) {
		const estimate = await EstimatesRepository.queryByTokenHash(
			hashOpaqueToken(token)
		);
		if (!estimate) {
			throw new AppError("ESTIMATE_LINK_INVALID");
		}
		return estimate;
	}

	/** What the client sees on the public page: no internal ids or staff data. */
	private static async publicView(estimate: EstimateRow) {
		const [items, context] = await Promise.all([
			EstimatesRepository.queryItemsByEstimateIds([estimate.id]),
			EstimatesRepository.queryPdfContext(estimate.id),
		]);
		if (!context) {
			throw new AppError("ESTIMATE_LINK_INVALID");
		}
		const record = withItems(estimate, items.get(estimate.id) ?? []);

		return {
			number: record.number,
			status: record.status,
			validUntil: record.validUntil,
			expired: isExpired(record),
			discountPercentage: record.discountPercentage,
			notes: record.notes,
			sentAt: record.sentAt,
			respondedAt: record.respondedAt,
			rejectionReason: record.rejectionReason,
			company: {
				name: context.company.name,
				email: context.company.email,
				phone: context.company.phone,
				website: context.company.website,
				logoUrl: context.company.logoUrl,
			},
			client: record.client ? { name: record.client.name } : null,
			device: context.device,
			items: record.items.map((item) => ({
				type: item.type,
				name: item.name,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				total: item.total,
			})),
			totals: record.totals,
		};
	}

	static async getPublicEstimate({
		token,
		response,
	}: {
		token: string;
		response: FastifyReply;
	}) {
		const estimate = await EstimatesService.queryByToken(token);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "get_estimate_success",
				message: "Estimate retrieved successfully.",
				data: await EstimatesService.publicView(estimate),
			})
		);
	}

	static async getPublicEstimatePdf({
		token,
		locale,
		response,
	}: {
		token: string;
		locale: Locale;
		response: FastifyReply;
	}) {
		const estimate = await EstimatesService.queryByToken(token);
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

	/** The client approves or rejects the estimate from the public link. */
	static async answerEstimate({
		token,
		answer,
		response,
	}: {
		token: string;
		answer: { status: "approved" } | { status: "rejected"; reason?: string };
		response: FastifyReply;
	}) {
		const estimate = await EstimatesService.queryByToken(token);

		if (estimate.status !== "sent") {
			throw new AppError("ESTIMATE_ALREADY_ANSWERED");
		}
		if (isExpired(estimate)) {
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

		const updated = await EstimatesService.queryByToken(token);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code:
					answer.status === "approved"
						? "approve_estimate_success"
						: "reject_estimate_success",
				message: "Answer recorded.",
				data: await EstimatesService.publicView(updated),
			})
		);
	}

	static async deleteEstimate({
		userJwt,
		subdomain,
		estimateId,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		estimateId: string;
		response: FastifyReply;
	}) {
		const companyId = EstimatesService.resolveCompanyId(userJwt, subdomain);
		const estimate = await EstimatesService.queryOwnEstimate(
			estimateId,
			companyId
		);
		if (estimate.status !== "draft") {
			throw new AppError("ESTIMATE_NOT_EDITABLE");
		}

		await EstimatesRepository.deleteEstimate(estimateId);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "delete_estimate_success",
				message: "Estimate deleted successfully.",
				data: null,
			})
		);
	}

	/** Render the estimate PDF of a company (also used by the email flow). */
	static async buildPdf(estimateId: string, companyId: string, locale: Locale) {
		const estimate = await EstimatesService.detail(estimateId, companyId);
		const [context, client] = await Promise.all([
			EstimatesRepository.queryPdfContext(estimateId),
			estimate.clientId
				? EstimatesRepository.queryClient(estimate.clientId)
				: Promise.resolve(null),
		]);
		if (!context) {
			throw new AppError("ESTIMATE_NOT_FOUND");
		}

		const { logoUrl, ...company } = context.company;
		const pdf = await renderEstimatePdf(
			{
				number: estimate.number,
				serviceOrderCode: formatServiceOrderCode(
					context.subdomain,
					context.serviceOrderNumber
				),
				issuedAt: estimate.createdAt,
				validUntil: estimate.validUntil,
				discountPercentage: estimate.discountPercentage,
				notes: estimate.notes,
				company: { ...company, logo: await fetchLogo(logoUrl) },
				client,
				device: context.device,
				items: estimate.items,
				totals: estimate.totals,
			},
			locale
		);

		const fileName = createTranslator(locale).t("estimates.pdf.fileName", {
			number: String(estimate.number).padStart(4, "0"),
		});

		return { pdf, fileName, detail: estimate, context, client };
	}

	static async getEstimatePdf({
		userJwt,
		subdomain,
		estimateId,
		locale,
		response,
	}: {
		userJwt: UserJwt;
		subdomain: string;
		estimateId: string;
		locale: Locale;
		response: FastifyReply;
	}) {
		const companyId = EstimatesService.resolveCompanyId(userJwt, subdomain);
		const { pdf, fileName } = await EstimatesService.buildPdf(
			estimateId,
			companyId,
			locale
		);

		return response
			.status(200)
			.header("Content-Type", "application/pdf")
			.header("Content-Disposition", `inline; filename="${fileName}"`)
			.send(pdf);
	}
}
