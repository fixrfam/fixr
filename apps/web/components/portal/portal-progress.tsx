"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Check } from "lucide-react";
import type { PortalServiceOrderStatus } from "@/lib/services/portal";
import { cn } from "@/lib/utils";
import { PORTAL_STEPS } from "./store";

/** A thin segmented bar: how far along the order is. */
export function PortalProgressBar({
	status,
	className,
}: {
	status: PortalServiceOrderStatus;
	className?: string;
}) {
	const current = PORTAL_STEPS.indexOf(status);
	let fill = "bg-primary";
	if (status === "ready" || status === "delivered") {
		fill = "bg-emerald-500";
	}

	return (
		<div aria-hidden className={cn("flex gap-1", className)}>
			{PORTAL_STEPS.map((step, index) => (
				<span
					className={cn(
						"h-1.5 flex-1 rounded-full bg-muted transition-colors",
						index <= current && fill,
						// The customer's turn stands out.
						index === current && status === "waiting_approval" && "bg-amber-500"
					)}
					key={step}
				/>
			))}
		</div>
	);
}

/** Every step of the lifecycle, with the date the order reached it. */
export function PortalTimeline({
	status,
	history,
}: {
	status: PortalServiceOrderStatus;
	history: { status: PortalServiceOrderStatus; at: string }[];
}) {
	const { t, format } = useTranslation();
	const current = PORTAL_STEPS.indexOf(status);
	const reachedAt = new Map<PortalServiceOrderStatus, string>();
	for (const entry of history) {
		reachedAt.set(entry.status, entry.at);
	}

	return (
		<ol className="relative space-y-0">
			{PORTAL_STEPS.map((step, index) => {
				const done = index < current;
				const active = index === current;
				const date = reachedAt.get(step);
				return (
					<li className="relative flex gap-3 pb-5 last:pb-0" key={step}>
						{index < PORTAL_STEPS.length - 1 && (
							<span
								aria-hidden
								className={cn(
									"absolute top-6 left-[0.6875rem] h-[calc(100%-1.25rem)] w-0.5 rounded-full",
									done ? "bg-primary" : "bg-border"
								)}
							/>
						)}
						<span
							className={cn(
								"relative z-1 grid size-6 shrink-0 place-items-center rounded-full border-2 bg-background",
								done && "border-primary bg-primary text-primary-foreground",
								active && "border-primary ring-4 ring-primary/15",
								!(done || active) && "border-border"
							)}
						>
							{done ? (
								<Check className="size-3.5" strokeWidth={3} />
							) : (
								active && <span className="size-2 rounded-full bg-primary" />
							)}
						</span>
						<div className="min-w-0 pt-0.5">
							<p
								className={cn(
									"text-sm",
									active ? "font-semibold" : "text-muted-foreground",
									done && "text-foreground"
								)}
							>
								{t(`portal.status.${step}`)}
							</p>
							{date && (done || active) && (
								<p className="text-muted-foreground text-xs">
									{t("portal.detail.reached", {
										date: format.dateTime(date),
									})}
								</p>
							)}
						</div>
					</li>
				);
			})}
		</ol>
	);
}
