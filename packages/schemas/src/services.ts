import { i18nMessage } from "@fixr/i18n";
import { z } from "zod";
import { getPaginatedDataSchema } from "./utils";

const topicSchema = z
	.string()
	.min(1)
	.max(200, i18nMessage("validation.service.topicMax", { count: 200 }));

export const createServiceSchema = z.object({
	name: z
		.string()
		.min(1, i18nMessage("validation.name.required"))
		.max(120, i18nMessage("validation.name.atMost", { count: 120 })),
	description: z
		.string()
		.min(1, i18nMessage("validation.service.descriptionRequired"))
		.max(500, i18nMessage("validation.service.descriptionMax", { count: 500 })),
	estimatedDurationMinutes: z
		.number({ error: i18nMessage("validation.service.durationRequired") })
		.int(i18nMessage("validation.service.durationInteger"))
		.min(1, i18nMessage("validation.service.durationMin")),
	price: z
		.number({ error: i18nMessage("validation.service.priceRequired") })
		.min(0, i18nMessage("validation.service.priceMin")),
	partIds: z.array(z.string()),
	deviceCategories: z
		.array(z.string())
		.min(1, i18nMessage("validation.service.deviceCategoriesRequired")),
	testInstructions: z.array(topicSchema),
	testParameters: z.array(topicSchema),
});

/** @description Body schema for partially updating a service */
export const patchServiceSchema = createServiceSchema.partial();

/** @description Query schema for listing services: pagination, search and filters */
export const getServicesQuerySchema = getPaginatedDataSchema.extend({
	deviceCategory: z.string().optional(),
	sort: z.enum(["newer", "older", "name"]).optional(),
});

/** @description Params schema for routes that target a single service */
export const serviceIdParamsSchema = z.object({
	serviceId: z.string().cuid2(),
});
