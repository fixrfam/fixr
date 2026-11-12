import type { Locale } from "@fixr/i18n";
import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	createEstimateSchema,
	estimateStatuses,
	getEstimatesQuerySchema,
	patchEstimateSchema,
	rejectEstimateSchema,
} from "@fixr/schemas/estimates";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { EstimatesService } from "../services";

type UserJwt = z.infer<typeof jwtPayload>;

interface EstimateParams {
	userJwt: UserJwt;
	subdomain: string;
	estimateId: string;
	response: FastifyReply;
}

/** @description Estimates request handlers */
export class EstimatesController {
	static listEstimates(
		params: {
			userJwt: UserJwt;
			subdomain: string;
			response: FastifyReply;
		} & z.infer<typeof getEstimatesQuerySchema>
	) {
		return EstimatesService.listEstimates(params);
	}

	static getEstimate(params: EstimateParams) {
		return EstimatesService.getEstimate(params);
	}

	static createEstimate(params: {
		userJwt: UserJwt;
		subdomain: string;
		data: z.infer<typeof createEstimateSchema>;
		response: FastifyReply;
	}) {
		return EstimatesService.createEstimate(params);
	}

	static patchEstimate(
		params: EstimateParams & { data: z.infer<typeof patchEstimateSchema> }
	) {
		return EstimatesService.patchEstimate(params);
	}

	static updateStatus(
		params: EstimateParams & { status: z.infer<typeof estimateStatuses> }
	) {
		return EstimatesService.updateStatus(params);
	}

	static deleteEstimate(params: EstimateParams) {
		return EstimatesService.deleteEstimate(params);
	}

	static getEstimatePdf(params: EstimateParams & { locale: Locale }) {
		return EstimatesService.getEstimatePdf(params);
	}

	static sendEstimate(
		params: EstimateParams & { email?: string; locale: Locale }
	) {
		return EstimatesService.sendEstimate(params);
	}

	static getPublicEstimate(params: { token: string; response: FastifyReply }) {
		return EstimatesService.getPublicEstimate(params);
	}

	static getPublicEstimatePdf(params: {
		token: string;
		locale: Locale;
		response: FastifyReply;
	}) {
		return EstimatesService.getPublicEstimatePdf(params);
	}

	static approvePublicEstimate(params: {
		token: string;
		response: FastifyReply;
	}) {
		return EstimatesService.answerEstimate({
			...params,
			answer: { status: "approved" },
		});
	}

	static rejectPublicEstimate(params: {
		token: string;
		data: z.infer<typeof rejectEstimateSchema>;
		response: FastifyReply;
	}) {
		return EstimatesService.answerEstimate({
			token: params.token,
			answer: { status: "rejected", reason: params.data.reason },
			response: params.response,
		});
	}
}
