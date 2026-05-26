import type { ServiceOrderStatusId } from "@/lib/utils/service-orders";

/** A single status transition recorded in the order history. */
export interface HistoryEntry {
	id: string;
	status: ServiceOrderStatusId;
	dateTime: string;
	comment: string;
}

export interface ServiceOrderLifecycleProps {
	currentStatus: ServiceOrderStatusId;
	history?: HistoryEntry[];
}

export { ServiceOrderLifecycle } from "./service-order-lifecycle";
