import { i18nMessage } from "@fixr/i18n";
import { z } from "zod";
import { getPaginatedDataSchema } from "./utils";

/** @description Lifecycle of an estimate: drafted, sent to the client, then approved or rejected */
export const estimateStatuses = z.enum([
	"draft",
	"sent",
	"approved",
	"rejected",
]);

const discountPercentage = z
	.number({ error: i18nMessage("validation.estimate.discountRequired") })
	.min(0, i18nMessage("validation.estimate.discountMin"))
	.max(100, i18nMessage("validation.estimate.discountMax"));

const notes = z
	.string()
	.max(1000, i18nMessage("validation.estimate.notesMax", { count: 1000 }));

/**
 * @description Body schema for creating an estimate from a service order. The
 * items are copied from the order; `validUntil` defaults to 30 days from now.
 */
export const createEstimateSchema = z.object({
	serviceOrderId: z
		.string()
		.cuid2(i18nMessage("validation.estimate.serviceOrderInvalid")),
	discountPercentage: discountPercentage.optional(),
	validUntil: z.coerce.date().optional(),
	notes: notes.optional(),
});

/** @description Body schema for editing a draft estimate */
export const patchEstimateSchema = z.object({
	discountPercentage: discountPercentage.optional(),
	validUntil: z.coerce.date().optional(),
	notes: notes.nullable().optional(),
});

/** @description Body schema for moving an estimate to another status */
export const updateEstimateStatusSchema = z.object({
	status: estimateStatuses,
});

/** @description Query schema for listing estimates: pagination, search (number or client) and filters */
export const getEstimatesQuerySchema = getPaginatedDataSchema.extend({
	status: estimateStatuses.optional(),
	serviceOrderId: z.string().cuid2().optional(),
});

/** @description Params schema for routes that target a single estimate */
export const estimateIdParamsSchema = z.object({
	estimateId: z.string().cuid2(),
});
