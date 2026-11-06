"use client";

import { useTranslation } from "@fixr/i18n/react";
import { ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { daysUntil } from "@/components/dashboard/estimates/store";
import { ModelImage } from "@/components/dashboard/models/model-image";
import type {
	PortalEstimateSummary,
	PortalServiceOrderSummary,
} from "@/lib/services/portal";
import { cn } from "@/lib/utils";
import { PortalProgressBar } from "./portal-progress";
import { PortalStatusBadge } from "./portal-status-badge";

const ESTIMATE_TONE = {
	draft: "bg-muted text-muted-foreground",
	sent: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
	approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
	rejected: "bg-red-500/15 text-red-700 dark:text-red-300",
} as const;

/** A shop's logo, or its initial on the brand color. */
export function ShopMark({
	shop,
	className,
}: {
	shop: { name: string; logoUrl: string | null };
	className?: string;
}) {
	if (shop.logoUrl) {
		return (
			<img
				alt=""
				className={cn(
					"size-5 shrink-0 rounded-md border bg-background object-contain",
					className
				)}
				height={20}
				src={shop.logoUrl}
				width={20}
			/>
		);
	}
	return (
		<span
			aria-hidden
			className={cn(
				"grid size-5 shrink-0 place-items-center rounded-md bg-primary font-semibold text-[0.625rem] text-primary-foreground",
				className
			)}
		>
			{shop.name.charAt(0).toUpperCase()}
		</span>
	);
}

/** One repair: the device, the shop, where it stands and how far it is. */
export function PortalServiceOrderCard({
	order,
}: {
	order: PortalServiceOrderSummary;
}) {
	const { t, format } = useTranslation();

	return (
		<Link
			className={cn(
				"group block rounded-2xl border bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]",
				order.pendingEstimate && "border-amber-500/40",
				order.status === "ready" && "border-emerald-500/40"
			)}
			href={`/portal/service-orders/${order.id}`}
		>
			<div className="flex items-start gap-3">
				<ModelImage
					alt={order.deviceModel}
					category={order.deviceCategory}
					className="size-14 rounded-xl"
					src={order.deviceImageUrl}
				/>
				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0">
							<p className="truncate font-semibold">{order.deviceModel}</p>
							<p className="flex items-center gap-1.5 truncate text-muted-foreground text-xs">
								<ShopMark className="size-4" shop={order.company} />
								<span className="truncate">{order.company.name}</span>
								<span aria-hidden>·</span>
								<span className="tabular-nums">{order.code}</span>
							</p>
						</div>
						<ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
					</div>
				</div>
			</div>
			<PortalProgressBar className="mt-4" status={order.status} />
			<div className="mt-2.5 flex items-center justify-between gap-2">
				<PortalStatusBadge status={order.status} />
				<span className="flex items-center gap-1 text-muted-foreground text-xs">
					<Clock className="size-3" />
					{t("portal.list.updated", {
						time: format.relativeTime(order.updatedAt),
					})}
				</span>
			</div>
			{order.pendingEstimate && (
				<p className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 font-medium text-amber-800 text-xs dark:text-amber-200">
					{t("portal.list.pendingEstimate")}
				</p>
			)}
		</Link>
	);
}

/** One estimate: the shop, the device, the total and whether it waits for an answer. */
export function PortalEstimateCard({
	estimate,
	highlight = false,
}: {
	estimate: PortalEstimateSummary;
	highlight?: boolean;
}) {
	const { t, format } = useTranslation();
	const days = daysUntil(estimate.validUntil);
	const open = estimate.status === "sent" && !estimate.expired;

	return (
		<Link
			className={cn(
				"group block rounded-2xl border bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]",
				highlight &&
					"border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-card"
			)}
			href={`/portal/estimates/${estimate.id}`}
		>
			<div className="flex items-center gap-2 text-muted-foreground text-xs">
				<ShopMark className="size-4" shop={estimate.company} />
				<span className="truncate">{estimate.company.name}</span>
				<span aria-hidden>·</span>
				<span className="tabular-nums">
					#{String(estimate.number).padStart(4, "0")}
				</span>
				<span
					className={cn(
						"ml-auto shrink-0 rounded-full px-2.5 py-0.5 font-medium",
						estimate.expired && estimate.status === "sent"
							? "bg-muted text-muted-foreground"
							: ESTIMATE_TONE[estimate.status]
					)}
				>
					{estimate.expired && estimate.status === "sent"
						? t("portal.estimates.expired")
						: t(`estimates.status.${estimate.status}`)}
				</span>
			</div>
			<div className="mt-3 flex items-end justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					<ModelImage
						alt={estimate.deviceModel}
						category={estimate.deviceCategory}
						className="size-11 rounded-xl"
						src={estimate.deviceImageUrl}
					/>
					<div className="min-w-0">
						<p className="truncate font-medium text-sm">
							{estimate.deviceModel}
						</p>
						<p className="text-muted-foreground text-xs tabular-nums">
							{estimate.serviceOrderCode}
						</p>
					</div>
				</div>
				<p className="shrink-0 font-heading font-semibold text-xl tabular-nums">
					{format.currency(estimate.totals.total)}
				</p>
			</div>
			{open && (
				<div className="mt-3 flex items-center justify-between gap-2 border-t pt-3 text-xs">
					<span
						className={cn(
							"text-muted-foreground",
							days <= 3 && "text-amber-700 dark:text-amber-300"
						)}
					>
						{t("portal.estimates.validUntil", {
							date: format.date(estimate.validUntil),
						})}
					</span>
					<span className="flex items-center gap-1 font-medium text-primary">
						{t("portal.home.seeEstimate")}
						<ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
					</span>
				</div>
			)}
		</Link>
	);
}
