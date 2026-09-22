import type { StaticTranslationKey } from "@fixr/i18n";

export type DataTableConfig = typeof dataTableConfig;

/**
 * Operators the filter UI offers. Each one carries the key of its label so
 * the same config can render in any language.
 */
export const dataTableConfig = {
	textOperators: [
		{ labelKey: "dataTable.operators.contains", value: "iLike" as const },
		{ labelKey: "dataTable.operators.notContains", value: "notILike" as const },
		{ labelKey: "dataTable.operators.is", value: "eq" as const },
		{ labelKey: "dataTable.operators.isNot", value: "ne" as const },
		{ labelKey: "dataTable.operators.isEmpty", value: "isEmpty" as const },
		{ labelKey: "dataTable.operators.isNotEmpty", value: "isNotEmpty" as const },
	],
	numericOperators: [
		{ labelKey: "dataTable.operators.is", value: "eq" as const },
		{ labelKey: "dataTable.operators.isNot", value: "ne" as const },
		{ labelKey: "dataTable.operators.lessThan", value: "lt" as const },
		{
			labelKey: "dataTable.operators.lessThanOrEqual",
			value: "lte" as const,
		},
		{ labelKey: "dataTable.operators.greaterThan", value: "gt" as const },
		{
			labelKey: "dataTable.operators.greaterThanOrEqual",
			value: "gte" as const,
		},
		{ labelKey: "dataTable.operators.between", value: "isBetween" as const },
		{ labelKey: "dataTable.operators.isEmpty", value: "isEmpty" as const },
		{ labelKey: "dataTable.operators.isNotEmpty", value: "isNotEmpty" as const },
	],
	dateOperators: [
		{ labelKey: "dataTable.operators.is", value: "eq" as const },
		{ labelKey: "dataTable.operators.isNot", value: "ne" as const },
		{ labelKey: "dataTable.operators.before", value: "lt" as const },
		{ labelKey: "dataTable.operators.after", value: "gt" as const },
		{ labelKey: "dataTable.operators.onOrBefore", value: "lte" as const },
		{ labelKey: "dataTable.operators.onOrAfter", value: "gte" as const },
		{ labelKey: "dataTable.operators.between", value: "isBetween" as const },
		{
			labelKey: "dataTable.operators.relativeToToday",
			value: "isRelativeToToday" as const,
		},
		{ labelKey: "dataTable.operators.isEmpty", value: "isEmpty" as const },
		{ labelKey: "dataTable.operators.isNotEmpty", value: "isNotEmpty" as const },
	],
	selectOperators: [
		{ labelKey: "dataTable.operators.is", value: "eq" as const },
		{ labelKey: "dataTable.operators.isNot", value: "ne" as const },
		{ labelKey: "dataTable.operators.isEmpty", value: "isEmpty" as const },
		{ labelKey: "dataTable.operators.isNotEmpty", value: "isNotEmpty" as const },
	],
	multiSelectOperators: [
		{ labelKey: "dataTable.operators.hasAnyOf", value: "inArray" as const },
		{ labelKey: "dataTable.operators.hasNoneOf", value: "notInArray" as const },
		{ labelKey: "dataTable.operators.isEmpty", value: "isEmpty" as const },
		{ labelKey: "dataTable.operators.isNotEmpty", value: "isNotEmpty" as const },
	],
	booleanOperators: [
		{ labelKey: "dataTable.operators.is", value: "eq" as const },
		{ labelKey: "dataTable.operators.isNot", value: "ne" as const },
	],
	sortOrders: [
		{ labelKey: "dataTable.sort.asc", value: "asc" as const },
		{ labelKey: "dataTable.sort.desc", value: "desc" as const },
	],
	filterVariants: [
		"text",
		"number",
		"range",
		"date",
		"dateRange",
		"boolean",
		"select",
		"multiSelect",
	] as const,
	operators: [
		"iLike",
		"notILike",
		"eq",
		"ne",
		"inArray",
		"notInArray",
		"isEmpty",
		"isNotEmpty",
		"lt",
		"lte",
		"gt",
		"gte",
		"isBetween",
		"isRelativeToToday",
	] as const,
	joinOperators: ["and", "or"] as const,
} satisfies {
	[key: string]:
		| readonly { labelKey: StaticTranslationKey; value: string }[]
		| readonly string[];
};
