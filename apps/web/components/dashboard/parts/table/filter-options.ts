import type { Translator } from "@fixr/i18n";
import { partCategories } from "@fixr/mock";
import { STOCK_STATUS_KEYS, type StockStatusId } from "./data";

interface FilterOption {
	label: string;
	value: string;
}

export const CATEGORY_OPTIONS: FilterOption[] = partCategories.map(
	(category) => ({ label: category, value: category })
);

export function stockStatusOptions(t: Translator["t"]): FilterOption[] {
	return (Object.keys(STOCK_STATUS_KEYS) as StockStatusId[]).map((id) => ({
		label: t(STOCK_STATUS_KEYS[id]),
		value: id,
	}));
}
