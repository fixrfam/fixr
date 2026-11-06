"use client";

import type { StaticTranslationKey } from "@fixr/i18n";
import { useTranslation } from "@fixr/i18n/react";
import {
	Check,
	ClipboardList,
	Clock,
	type LucideIcon,
	PackageCheck,
	Wrench,
} from "lucide-react";
import { serviceOrderStatusKeys } from "@/lib/i18n/labels";
import type {
	ServiceOrderHistoryEntry,
	ServiceOrderStatus,
} from "@/lib/services/service-orders";
import { cn } from "@/lib/utils";

type PhaseState = "done" | "active" | "upcoming";

interface Phase {
	id: string;
	title: StaticTranslationKey;
	description: StaticTranslationKey;
	statuses: readonly ServiceOrderStatus[];
	icon: LucideIcon;
}

/** The statuses grouped in the four moments a customer cares about. */
export const PHASES: readonly Phase[] = [
	{
		id: "recognition",
		title: "serviceOrders.lifecycle.recognitionTitle",
		description: "serviceOrders.lifecycle.recognitionDescription",
		statuses: ["pending", "diagnosing"],
		icon: ClipboardList,
	},
	{
		id: "approval",
		title: "serviceOrders.lifecycle.pendingTitle",
		description: "serviceOrders.lifecycle.pendingDescription",
		statuses: ["waiting_approval", "approved"],
		icon: Clock,
	},
	{
		id: "progress",
		title: "serviceOrders.lifecycle.progressTitle",
		description: "serviceOrders.lifecycle.progressDescription",
		statuses: ["fixing"],
		icon: Wrench,
	},
	{
		id: "finished",
		title: "serviceOrders.lifecycle.finishedTitle",
		description: "serviceOrders.lifecycle.finishedDescription",
		statuses: ["ready", "delivered"],
		icon: PackageCheck,
	},
];

/** The phase the order is in; past the last one once it was delivered. */
function activePhase(status: ServiceOrderStatus) {
	if (status === "delivered") {
		return PHASES.length;
	}
	return PHASES.findIndex((phase) => phase.statuses.includes(status));
}

function phaseState(index: number, active: number): PhaseState {
	if (index < active) {
		return "done";
	}
	return index === active ? "active" : "upcoming";
}

const DOT_CLASS: Record<PhaseState, string> = {
	done: "bg-emerald-500 text-white",
	active: "bg-primary text-white ring-4 ring-primary/15",
	upcoming:
		"border border-dashed border-muted-foreground/40 bg-background text-muted-foreground",
};

const BADGE_CLASS: Record<PhaseState, string> = {
	done: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
	active: "bg-primary/10 text-primary",
	upcoming: "bg-muted text-muted-foreground",
};

const BADGE_LABEL: Record<PhaseState, StaticTranslationKey> = {
	done: "serviceOrders.phase.finished",
	active: "serviceOrders.phase.inProgress",
	upcoming: "serviceOrders.phase.pending",
};

/** The line to the next phase: solid once passed, fading out of the current one. */
const LINE_CLASS: Record<PhaseState, string> = {
	done: "bg-emerald-500",
	active: "bg-gradient-to-b from-primary to-border",
	upcoming: "bg-border",
};

/** What happened in a phase: each status the order reached, by whom and why. */
function PhaseEntries({ entries }: { entries: ServiceOrderHistoryEntry[] }) {
	const { t, format } = useTranslation();

	return (
		<ol className="mt-2.5 grid gap-2.5 border-l pl-3">
			{entries.map((entry) => (
				<li className="grid gap-0.5" key={entry.id}>
					<div className="flex flex-wrap items-baseline gap-x-1.5 text-xs">
						<span className="font-medium text-foreground">
							{entry.from === null
								? t("serviceOrders.statusCard.opened")
								: t(serviceOrderStatusKeys[entry.to])}
						</span>
						<span className="text-muted-foreground">
							{entry.employee
								? t("serviceOrders.statusCard.by", {
										name: entry.employee.name,
									})
								: t("serviceOrders.statusCard.bySystem")}
						</span>
						<time
							className="ml-auto text-muted-foreground tabular-nums"
							dateTime={entry.createdAt}
						>
							{format.dateTime(entry.createdAt)}
						</time>
					</div>
					{entry.note && (
						<p className="whitespace-pre-line text-pretty text-muted-foreground text-xs">
							{entry.note}
						</p>
					)}
				</li>
			))}
		</ol>
	);
}

/**
 * The order's lifecycle by phase, with the history of each phase under it:
 * when the order reached each status, who moved it and their note.
 */
export function ServiceOrderLifecycle({
	status,
	history,
}: {
	status: ServiceOrderStatus;
	history: ServiceOrderHistoryEntry[];
}) {
	const { t } = useTranslation();
	const active = activePhase(status);

	return (
		<ol className="grid">
			{PHASES.map((phase, index) => {
				const state = phaseState(index, active);
				const Icon = state === "done" ? Check : phase.icon;
				const entries = history.filter((entry) =>
					phase.statuses.includes(entry.to)
				);
				const last = index === PHASES.length - 1;

				return (
					<li
						aria-current={state === "active" ? "step" : undefined}
						className={cn(
							"relative grid grid-cols-[2rem_1fr] gap-x-3",
							!last && "pb-5"
						)}
						key={phase.id}
					>
						{!last && (
							<span
								aria-hidden
								className={cn(
									"absolute top-9 bottom-1 left-[calc(1rem-1px)] w-0.5 rounded-full",
									LINE_CLASS[state]
								)}
							/>
						)}
						<span
							className={cn(
								"relative grid size-8 place-items-center rounded-full",
								DOT_CLASS[state]
							)}
						>
							<Icon className="size-4" />
						</span>
						<div className="min-w-0 pt-1">
							<div className="flex items-center justify-between gap-3">
								<p
									className={cn(
										"font-medium text-sm",
										state === "upcoming" && "text-muted-foreground"
									)}
								>
									{t(phase.title)}
								</p>
								<span
									className={cn(
										"shrink-0 rounded-full px-2 py-0.5 font-medium text-[11px]",
										BADGE_CLASS[state]
									)}
								>
									{t(BADGE_LABEL[state])}
								</span>
							</div>
							<p className="text-pretty text-muted-foreground text-xs">
								{t(phase.description)}
							</p>
							{entries.length > 0 && <PhaseEntries entries={entries} />}
						</div>
					</li>
				);
			})}
		</ol>
	);
}
