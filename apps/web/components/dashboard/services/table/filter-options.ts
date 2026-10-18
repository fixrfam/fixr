import { serviceDeviceCategories } from "@fixr/mock";

interface FilterOption {
	label: string;
	value: string;
}

export const DEVICE_CATEGORY_OPTIONS: FilterOption[] =
	serviceDeviceCategories.map((category) => ({
		label: category,
		value: category,
	}));
