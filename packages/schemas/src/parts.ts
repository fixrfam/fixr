import { i18nMessage } from "@fixr/i18n";
import { z } from "zod";

export const createPartSchema = z
	.object({
		sku: z
			.string()
			.min(1, i18nMessage("validation.part.skuRequired"))
			.max(50, i18nMessage("validation.part.skuMax", { count: 50 })),
		name: z
			.string()
			.min(1, i18nMessage("validation.name.required"))
			.max(120, i18nMessage("validation.name.atMost", { count: 120 })),
		category: z
			.string()
			.min(1, i18nMessage("validation.part.categoryRequired")),
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
	})
	.refine((data) => data.salePrice >= data.costPrice, {
		message: i18nMessage("validation.part.salePriceBelowCost"),
		path: ["salePrice"],
	});
