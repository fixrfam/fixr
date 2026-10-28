import type { Locale } from "@fixr/i18n";
import type { jwtPayload } from "@fixr/schemas/auth";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import type { PortalIdentity } from "../repositories";
import { PortalService } from "../services";

type UserJwt = z.infer<typeof jwtPayload>;

interface PortalParams {
	identity: PortalIdentity;
	response: FastifyReply;
}

/** @description Customer portal request handlers */
export class PortalController {
	static openFromPortalLink(params: { token: string; response: FastifyReply }) {
		return PortalService.openFromPortalLink(params);
	}

	static openFromEstimateLink(params: {
		token: string;
		response: FastifyReply;
	}) {
		return PortalService.openFromEstimateLink(params);
	}

	static signOut(params: {
		token: string | undefined;
		response: FastifyReply;
	}) {
		return PortalService.signOut(params);
	}

	static requestAccess(params: {
		email: string;
		locale: Locale;
		response: FastifyReply;
	}) {
		return PortalService.requestAccess(params);
	}

	static me(params: PortalParams) {
		return PortalService.me(params);
	}

	static listServiceOrders(params: PortalParams) {
		return PortalService.listServiceOrders(params);
	}

	static getServiceOrder(params: PortalParams & { serviceOrderId: string }) {
		return PortalService.getServiceOrder(params);
	}

	static getEstimatePdf(
		params: PortalParams & { estimateId: string; locale: Locale }
	) {
		return PortalService.getEstimatePdf(params);
	}

	static approveEstimate(params: PortalParams & { estimateId: string }) {
		return PortalService.answerEstimate({
			...params,
			answer: { status: "approved" },
		});
	}

	static rejectEstimate(
		params: PortalParams & { estimateId: string; reason?: string }
	) {
		const { reason, ...rest } = params;
		return PortalService.answerEstimate({
			...rest,
			answer: { status: "rejected", reason },
		});
	}

	static sendAccess(params: {
		userJwt: UserJwt;
		subdomain: string;
		customerId: string;
		locale: Locale;
		response: FastifyReply;
	}) {
		return PortalService.sendAccess(params);
	}
}
