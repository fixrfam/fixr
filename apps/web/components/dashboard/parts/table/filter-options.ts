import { partCategories } from "@fixr/mock";
import type { FilterOption } from "./catalog-filters";

export const CATEGORY_OPTIONS: FilterOption[] = partCategories.map(
	(category) => ({ label: category, value: category })
);
