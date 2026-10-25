import { i18nMessage } from "@fixr/i18n";
import { z } from "zod";
import { getPaginatedDataSchema } from "./utils";

/** @description Part fields without cross-field rules (reused by create and patch) */
export const partBaseSchema = z.object({
	sku: z
		.string()
		.min(1, i18nMessage("validation.part.skuRequired"))
		.max(50, i18nMessage("validation.part.skuMax", { count: 50 })),
	name: z
		.string()
		.min(1, i18nMessage("validation.name.required"))
		.max(120, i18nMessage("validation.name.atMost", { count: 120 })),
	description: z
		.string()
		.max(1000, i18nMessage("validation.part.descriptionMax", { count: 1000 }))
		.optional(),
	category: z
		.string()
		.min(1, i18nMessage("validation.part.categoryRequired"))
		.max(60, i18nMessage("validation.part.categoryMax", { count: 60 })),
	costPrice: z
		.number({ error: i18nMessage("validation.part.costPriceRequired") })
		.min(0, i18nMessage("validation.part.costPriceMin")),
	salePrice: z
		.number({ error: i18nMessage("validation.part.salePriceRequired") })
		.min(0, i18nMessage("validation.part.salePriceMin")),
	stock: z
		.number({ error: i18nMessage("validation.part.stockRequired") })
		.int(i18nMessage("validation.part.stockInteger"))
		.min(0, i18nMessage("validation.part.stockMin")),
	minStock: z
		.number({ error: i18nMessage("validation.part.minStockRequired") })
		.int(i18nMessage("validation.part.minStockInteger"))
		.min(0, i18nMessage("validation.part.minStockMin")),
	supplierId: z
		.string()
		.min(1, i18nMessage("validation.part.supplierRequired")),
});

const salePriceBelowCost = {
	message: i18nMessage("validation.part.salePriceBelowCost"),
	path: ["salePrice"],
};

export const createPartSchema = partBaseSchema.refine(
	(data) => data.salePrice >= data.costPrice,
	salePriceBelowCost
);

/**
 * @description Body schema for partially updating a part. The price rule only
 * runs when both prices are sent; the service checks it against the stored
 * values otherwise. Stock is left out: it only changes through a stock
 * adjustment, which has its own permission.
 */
export const patchPartSchema = partBaseSchema
	.omit({ stock: true })
	.partial()
	.refine(
		(data) =>
			data.salePrice === undefined ||
			data.costPrice === undefined ||
			data.salePrice >= data.costPrice,
		salePriceBelowCost
	);

/** @description Body schema for adjusting a part's stock by a signed amount */
export const adjustPartStockSchema = z.object({
	delta: z
		.number({ error: i18nMessage("validation.part.stockDeltaRequired") })
		.int(i18nMessage("validation.part.stockDeltaInteger"))
		.refine(
			(delta) => delta !== 0,
			i18nMessage("validation.part.stockDeltaZero")
		),
});

/** @description Query schema for listing parts: pagination, search (name/SKU) and filters */
export const getPartsQuerySchema = getPaginatedDataSchema.extend({
	category: z.string().optional(),
	supplierId: z.string().cuid2().optional(),
	/** `"true"` returns only parts at or below their minimum stock. Kept as a string so the query parses idempotently. */
	lowStock: z.enum(["true", "false"]).optional(),
	sort: z.enum(["newer", "older", "name"]).optional(),
});

/** @description Params schema for routes that target a single part */
export const partIdParamsSchema = z.object({
	partId: z.string().cuid2(),
});
