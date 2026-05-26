import { mockServiceOrders } from "@fixr/mock";

interface FilterOption {
	label: string;
	value: string;
}

export const STATUS_OPTIONS: FilterOption[] = Array.from(
	new Map(
		mockServiceOrders.map((s) => [
			s.status.id,
			{ label: s.status.label, value: s.status.id },
		])
	).values()
);

export const LINE_OPTIONS: FilterOption[] = Array.from(
	new Set(mockServiceOrders.map((s) => s.line))
).map((line) => ({ label: line, value: line }));

export const TECH_OPTIONS: FilterOption[] = Array.from(
	new Set(mockServiceOrders.map((s) => s.technician))
).map((name) => ({ label: name, value: name }));
