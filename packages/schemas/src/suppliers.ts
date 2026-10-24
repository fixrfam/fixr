import { i18nMessage } from "@fixr/i18n";
import { z } from "zod";
import { documentSchema } from "./documents";
import { getPaginatedDataSchema } from "./utils";

export const createSupplierSchema = z.object({
	name: z
		.string()
		.min(1, i18nMessage("validation.name.required"))
		.max(120, i18nMessage("validation.name.atMost", { count: 120 })),
	cnpj: documentSchema("cnpj").min(
		1,
		i18nMessage("validation.supplier.cnpjRequired")
	),
	contact: z
		.string()
		.min(1, i18nMessage("validation.supplier.contactRequired")),
	phone: z.string().min(1, i18nMessage("validation.phone.required")),
	email: z
		.string()
		.min(1, i18nMessage("validation.email.required"))
		.email(i18nMessage("validation.email.invalid")),
});

/** @description Body schema for partially updating a supplier */
export const patchSupplierSchema = createSupplierSchema.partial();

/** @description Query schema for listing suppliers: pagination and search */
export const getSuppliersQuerySchema = getPaginatedDataSchema.extend({
	sort: z.enum(["newer", "older", "name"]).optional(),
});

/** @description Params schema for routes that target a single supplier */
export const supplierIdParamsSchema = z.object({
	supplierId: z.string().cuid2(),
});
