import { i18nMessage } from "@fixr/i18n";
import { z } from "zod";
import { documentSchema } from "./documents";
import { getPaginatedDataSchema } from "./utils";

export const createCustomerSchema = z.object({
	name: z
		.string()
		.min(1, i18nMessage("validation.name.required"))
		.max(100, i18nMessage("validation.name.atMost", { count: 100 })),
	email: z
		.string()
		.email(i18nMessage("validation.email.invalid"))
		.min(1, i18nMessage("validation.email.required")),
	cpf: documentSchema("cpf"),
	phone: z.string().min(1, i18nMessage("validation.phone.required")),
	alternativePhone: z.string().optional(),
	address: z
		.string()
		.min(1, i18nMessage("validation.address.required"))
		.max(255, i18nMessage("validation.address.max", { count: 255 })),
	state: z.string().min(2, i18nMessage("validation.state.required")).max(2),
	city: z.string().min(1, i18nMessage("validation.city.required")),
});

/** @description Body schema for partially updating a customer */
export const patchCustomerSchema = createCustomerSchema.partial();

/** @description Query schema for listing customers: pagination and search (name, CPF, phone, e-mail) */
export const getCustomersQuerySchema = getPaginatedDataSchema.extend({
	sort: z.enum(["newer", "older", "name"]).optional(),
});

/** @description Params schema for routes that target a single customer */
export const customerIdParamsSchema = z.object({
	customerId: z.string().cuid2(),
});
