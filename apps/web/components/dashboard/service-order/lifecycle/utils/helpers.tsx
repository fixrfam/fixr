import { Check, X } from "lucide-react";
import type { ComponentType } from "react";
import type { ServiceOrderStatusId } from "@/lib/utils/service-orders";
import type { PhaseStatus } from "./constants";

/** Returns the Tailwind class for the timeline dot based on phase state. */
export function getDotClass({
	isCanceled,
	isCompleted,
	isActive,
}: {
	isCanceled: boolean;
	isCompleted: boolean;
	isActive: boolean;
}) {
	if (isCanceled) {
		return "bg-rose-500 !border-0";
	}
	if (isCompleted) {
		return "bg-green-500 !border-0";
	}
	if (isActive) {
		return "bg-primary ring-2 ring-offset-2 ring-primary/60 ring-offset-card !border-0";
	}
	return "bg-primary/45 !border-0";
}

/** Returns the status label text for a phase based on its state. */
export function getStatusLabel({
	isCanceled,
	isCompleted,
	isActive,
}: {
	isCanceled: boolean;
	isCompleted: boolean;
	isActive: boolean;
}) {
	if (isCanceled) {
		return "Cancelado";
	}
	if (isCompleted) {
		return "Finalizado";
	}
	if (isActive) {
		return "Em progresso";
	}
	return "Pendente";
}

/** Returns the Tailwind class for the status badge based on phase state. */
export function getStatusBadgeClass({
	isCanceled,
	isCompleted,
	isActive,
}: {
	isCanceled: boolean;
	isCompleted: boolean;
	isActive: boolean;
}) {
	if (isCanceled) {
		return "bg-rose-500/15 text-rose-600 border-rose-500/30";
	}
	if (isCompleted) {
		return "bg-green-500/15 text-green-600 border-green-500/30";
	}
	if (isActive) {
		return "bg-primary/15 text-primary border-primary/30";
	}
	return "bg-primary/10 text-primary/60 border-primary/20";
}

/** Returns the Tailwind class for the timeline connector line based on phase state. */
export function getConnectorClass({
	isCompleted,
	isActive,
	connectorSpacingClass,
}: {
	isCompleted: boolean;
	isActive: boolean;
	connectorSpacingClass: string;
}) {
	if (isCompleted) {
		return `bg-green-500 ${connectorSpacingClass}`;
	}
	if (isActive) {
		return `[background:linear-gradient(to_bottom,hsl(var(--primary))_50%,hsl(var(--primary)/0.45)_50%)] ${connectorSpacingClass}`;
	}
	return `bg-primary/45 ${connectorSpacingClass}`;
}

/** Returns the icon element for the timeline dot based on phase state. */
export function getDotIcon({
	isCanceled,
	isCompleted,
	isActive,
	Icon,
}: {
	isCanceled: boolean;
	isCompleted: boolean;
	isActive: boolean;
	Icon: ComponentType<{ className?: string }>;
}) {
	if (isCanceled) {
		return <X className="size-5 text-white" />;
	}
	if (isCompleted) {
		return <Check className="size-5 text-white" />;
	}
	if (isActive) {
		return <Icon className="size-5 text-white" />;
	}
	return null;
}

/** Determines the phase status (done/active/upcoming) based on index comparison. */
export function getPhaseStatus(
	index: number,
	activeIndex: number
): PhaseStatus {
	if (index < activeIndex) {
		return "done";
	}
	if (index === activeIndex) {
		return "active";
	}
	return "upcoming";
}

/** Resolves the active phase index from the current service order status. */
export function resolveActivePhase(
	currentStatus: ServiceOrderStatusId
): number {
	switch (currentStatus) {
		case "registered":
		case "analysis":
			return 0;
		case "quote_pending":
		case "approval_pending":
		case "parts_pending":
			return 1;
		case "in_progress":
			return 2;
		case "ready_for_pickup":
		case "finished":
		case "canceled":
			return 3;
		default:
			return 0;
	}
}
