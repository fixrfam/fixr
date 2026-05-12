export const STATUS_STYLE_MAP = {
	parts_pending:
		"bg-green-400 ring-2 ring-offset-3 ring-offset-background ring-green-500 text-green-900",
	analysis:
		"bg-green-400 ring-2 ring-offset-3 ring-offset-background ring-green-500 text-green-900",
	finished:
		"bg-blue-400 ring-2 ring-offset-3 ring-offset-background ring-blue-500 text-blue-900",
	canceled:
		"bg-rose-400 ring-2 ring-offset-3 ring-offset-background ring-rose-500 text-rose-900",
	quote_pending:
		"bg-green-400 ring-2 ring-offset-3 ring-offset-background ring-green-500 text-green-900",
	approval_pending:
		"bg-green-400 ring-2 ring-offset-3 ring-offset-background ring-green-500 text-green-900",
	in_progress:
		"bg-blue-400 ring-2 ring-offset-3 ring-offset-background ring-blue-500 text-blue-900",
	ready_for_pickup:
		"bg-green-400 ring-2 ring-offset-3 ring-offset-background ring-green-500 text-green-900",
	contacted:
		"bg-gray-400 ring-2 ring-offset-3 ring-offset-background ring-gray-500 text-gray-900",
} as const;

export type ServiceOrderStatusId = keyof typeof STATUS_STYLE_MAP;

export function getStatusClass(statusId: ServiceOrderStatusId) {
	return STATUS_STYLE_MAP[statusId] ?? "bg-gray-100 text-gray-900";
}

export const STATUS_STYLE_MAP_TABLE = {
	parts_pending: "bg-green-400 text-green-900",
	analysis: "bg-green-400 text-green-900",
	finished: "bg-blue-400 text-blue-900",
	canceled: "bg-rose-400 text-rose-900",
	quote_pending: "bg-green-400 text-green-900",
	approval_pending: "bg-green-400 text-green900",
	in_progress: "bg-blue-400 text-blue-900",
	ready_for_pickup: "bg-green-400 text-green-900",
	contacted: "bg-gray-400 text-gray-900",
} as const;

export type ServiceOrderStatusIdTable = keyof typeof STATUS_STYLE_MAP_TABLE;

export function getStatusClassTable(statusId: ServiceOrderStatusId) {
	return STATUS_STYLE_MAP_TABLE[statusId] ?? "bg-gray-100 text-gray-900";
}
