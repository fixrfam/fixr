import type { ComponentType } from "react";
import type { ServiceOrderStatusId } from "@/lib/utils/service-orders";

/** Represents the state of a single phase in the timeline. */
export type PhaseStatus = "done" | "active" | "upcoming";

/** Configuration for a single phase in the service order lifecycle timeline. */
export interface PhaseDefinition {
	id: string;
	title: string;
	description: string;
	status: PhaseStatus;
	statuses: ServiceOrderStatusId[];
	icon: ComponentType<{ className?: string }>;
}
