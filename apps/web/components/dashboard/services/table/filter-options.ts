import { serviceDeviceCategories } from "@fixr/mock";
import type { FilterOption } from "@/components/dashboard/parts/table/catalog-filters";

export const DEVICE_CATEGORY_OPTIONS: FilterOption[] =
	serviceDeviceCategories.map((category) => ({
		label: category,
		value: category,
	}));
