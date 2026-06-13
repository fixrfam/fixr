"use client";

import { Check, ClipboardList, Clock, Wrench } from "lucide-react";
import {
	Timeline,
	TimelineConnector,
	TimelineContent,
	TimelineDescription,
	TimelineDot,
	TimelineHeader,
	TimelineItem,
	TimelineTitle,
} from "@/components/ui/timeline";
import type { ServiceOrderStatusId } from "@/lib/utils/service-orders";
import type { HistoryEntry, ServiceOrderLifecycleProps } from ".";
import {
	getConnectorClass,
	getDotClass,
	getDotIcon,
	getPhaseStatus,
	getStatusBadgeClass,
	getStatusLabel,
	resolveActivePhase,
} from "./utils/helpers";

export function ServiceOrderLifecycle({
	currentStatus,
	history,
}: ServiceOrderLifecycleProps) {
	const activeIndex = resolveActivePhase(currentStatus);
	/** Groups history entries by their status id so each phase can show its own entries. */
	const historyByStatus = (history ?? []).reduce<
		Partial<Record<ServiceOrderStatusId, HistoryEntry[]>>
	>(
		(acc, entry) => {
			const group = acc[entry.status];
			if (group) {
				group.push(entry);
			} else {
				acc[entry.status] = [entry];
			}
			return acc;
		},
		{} as Partial<Record<ServiceOrderStatusId, HistoryEntry[]>>
	);

	const phases = [
		{
			id: "recognition",
			title: "Reconhecimento",
			description: "Análise do problema relatado",
			status: getPhaseStatus(0, activeIndex),
			statuses: ["registered", "analysis"] as ServiceOrderStatusId[],
			icon: ClipboardList,
			fillableIcon: false,
		},
		{
			id: "pending",
			title: "Pendências",
			description: "Análise de pendências da OS",
			status: getPhaseStatus(1, activeIndex),
			statuses: [
				"quote_pending",
				"approval_pending",
				"parts_pending",
			] as ServiceOrderStatusId[],
			icon: Clock,
			fillableIcon: false,
		},
		{
			id: "progress",
			title: "Reparo em progresso",
			description: "Um técnico foi designado ao serviço",
			status: getPhaseStatus(2, activeIndex),
			statuses: ["in_progress"] as ServiceOrderStatusId[],
			icon: Wrench,
		},
		{
			id: "finished",
			title: "Finalizado",
			description: "Reparo finalizado pelo laboratório",
			status: getPhaseStatus(3, activeIndex),
			statuses: [
				"ready_for_pickup",
				"finished",
				"canceled",
			] as ServiceOrderStatusId[],
			icon: Check,
			fillableIcon: false,
		},
	];

	return (
		<Timeline
			activeIndex={activeIndex}
			className="[--timeline-connector-gap:0.75rem] [--timeline-dot-size:2.5rem]"
		>
			{phases.map((phase, idx) => {
				const isCompleted = phase.status === "done";
				const isActive = phase.status === "active";
				const isCanceled =
					currentStatus === "canceled" && phase.id === "finished";
				const isLast = idx === phases.length - 1;
				const entries = phase.statuses.flatMap(
					(status) => historyByStatus[status] ?? []
				);

				const dotClass = getDotClass({
					isCanceled,
					isCompleted,
					isActive,
				});

				/**
				 * Tailwind arbitrary-value classes that position the conector line
				 * relative to the timeline dot. The values are drived by the CSS
				 * custom properties set on `<Timeline>`.
				 */
				const connectorSpacingClass =
					"rounded-full !translate-y-[calc(var(--timeline-connector-gap)*4)] ![height:calc(100%-var(--timeline-connector-gap)*5)] ![left:calc(var(--timeline-dot-size)/2-1px)] ![width:2px]";

				return (
					<TimelineItem key={phase.id}>
						<TimelineDot
							className={`${dotClass} flex items-center justify-center`}
						>
							{getDotIcon({
								isCanceled,
								isCompleted,
								isActive,
								Icon: phase.icon,
								fillableIcon: phase.fillableIcon,
							})}
						</TimelineDot>

						{!isLast && (
							<TimelineConnector
								className={getConnectorClass({
									isCompleted,
									isActive,
									connectorSpacingClass,
								})}
								forceMount
							/>
						)}

						<TimelineContent>
							<TimelineHeader className="gap-0.5">
								<div className="flex items-center justify-between gap-4">
									<TimelineTitle>{phase.title}</TimelineTitle>
									<span
										className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${getStatusBadgeClass(
											{
												isCanceled,
												isCompleted,
												isActive,
											}
										)}`}
									>
										{getStatusLabel({
											isCanceled,
											isCompleted,
											isActive,
										})}
									</span>
								</div>
								<TimelineDescription className="text-muted-foreground">
									{phase.description}
								</TimelineDescription>
							</TimelineHeader>

							{entries.length > 0 && (
								<div className="mt-3 -ml-[calc(var(--timeline-dot-size)/2+0.75rem)] pl-[calc(var(--timeline-dot-size)/2+0.75rem)]">
									<div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
										<div className="relative space-y-3">
											{entries.map((entry, entryIndex) => (
												<div className="relative pl-6" key={entry.id}>
													<span className="absolute top-2 left-0 block size-2 rounded-full border border-border bg-muted-foreground/40" />
													{entryIndex < entries.length - 1 && (
														<span className="absolute top-4 left-0.75 h-[calc(100%+0.5rem)] w-px bg-border/70" />
													)}
													<span className="block text-muted-foreground text-xs">
														{entry.dateTime}
													</span>
													<p className="text-foreground text-sm">
														{entry.comment}
													</p>
												</div>
											))}
										</div>
									</div>
								</div>
							)}
						</TimelineContent>
					</TimelineItem>
				);
			})}
		</Timeline>
	);
}
