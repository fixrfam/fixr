import type { StaticTranslationKey } from "@fixr/i18n";
import type {
	PartRow,
	ServiceRow,
	SupplierRow,
} from "@/lib/services/inventory";

export type StockStatusId = "in_stock" | "low_stock" | "out_of_stock";

export const STOCK_STATUS_KEYS: Record<StockStatusId, StaticTranslationKey> = {
	in_stock: "parts.stockStatus.in_stock",
	low_stock: "parts.stockStatus.low_stock",
	out_of_stock: "parts.stockStatus.out_of_stock",
};

export interface PartTableRow extends PartRow {
	stockStatus: StockStatusId;
}

export interface ServiceTableRow extends ServiceRow {
	parts: PartRow[];
	/** True while some of the parts are still loading. */
	partsPending?: boolean;
}

export interface SupplierTableRow extends SupplierRow {
	/** Loaded per row; undefined while it loads. */
	partsCount?: number;
}

export function getStockStatus(
	part: Pick<PartRow, "stock" | "minStock">
): StockStatusId {
	if (part.stock <= 0) return "out_of_stock";
	if (part.stock <= part.minStock) return "low_stock";
	return "in_stock";
}

export function toPartRow(part: PartRow): PartTableRow {
	return { ...part, stockStatus: getStockStatus(part) };
}
