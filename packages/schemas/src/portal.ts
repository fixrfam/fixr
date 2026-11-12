import { i18nMessage } from "@fixr/i18n";
import { z } from "zod";

/** @description Body schema for a customer asking for a new portal link by email */
export const requestPortalAccessSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, i18nMessage("validation.email.required"))
		.max(255, i18nMessage("validation.email.invalid"))
		.email({ message: i18nMessage("validation.email.invalid") }),
	cfTurnstileToken: z.string().optional(),
});

/** @description Body schema for opening a portal session from a link token */
export const portalTokenSchema = z.object({
	token: z.string().min(32).max(64),
});

/** @description Params schema for portal routes on one service order */
export const portalServiceOrderParamsSchema = z.object({
	serviceOrderId: z.string().cuid2(),
});

/** @description Params schema for portal routes on one estimate */
export const portalEstimateParamsSchema = z.object({
	estimateId: z.string().cuid2(),
});
