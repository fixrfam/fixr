"use client";

import { useTranslation } from "@fixr/i18n/react";
import { mockServiceOrders } from "@fixr/mock";
import { useMemo } from "react";
import { serviceOrderStatusKeys } from "@/lib/i18n/labels";

interface FilterOption {
	label: string;
	value: string;
}

/**
 * Status options for the table filter.
 *
 * The ids come from the data, the copy from the catalog, so the filter reads
 * in the same language as the column it filters.
 */
export function useStatusOptions(): FilterOption[] {
	const { t } = useTranslation();

	return useMemo(
		() =>
			Array.from(new Set(mockServiceOrders.map((order) => order.status.id))).map(
				(id) => ({ label: t(serviceOrderStatusKeys[id]), value: id })
			),
		[t]
	);
}

export const CATEGORY_OPTIONS: FilterOption[] = Array.from(
	new Set(mockServiceOrders.map((s) => s.category))
).map((category) => ({ label: category, value: category }));

export const TECH_OPTIONS: FilterOption[] = Array.from(
	new Set(mockServiceOrders.map((s) => s.technician))
).map((name) => ({ label: name, value: name }));
