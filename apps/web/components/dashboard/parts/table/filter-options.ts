import { partCategories, serviceDeviceCategories } from "@fixr/mock";
import { STOCK_STATUS_LABELS, type StockStatusId } from "./data";

interface FilterOption {
	label: string;
	value: string;
}

export const CATEGORY_OPTIONS: FilterOption[] = partCategories.map(
	(category) => ({ label: category, value: category })
);

export const DEVICE_CATEGORY_OPTIONS: FilterOption[] =
	serviceDeviceCategories.map((category) => ({
		label: category,
		value: category,
	}));

export const STOCK_STATUS_OPTIONS: FilterOption[] = (
	Object.keys(STOCK_STATUS_LABELS) as StockStatusId[]
).map((id) => ({ label: STOCK_STATUS_LABELS[id], value: id }));
