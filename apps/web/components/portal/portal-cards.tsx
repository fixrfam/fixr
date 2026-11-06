"use client";

import { useTranslation } from "@fixr/i18n/react";
import { ChevronRight, HandCoins } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { daysUntil } from "@/components/dashboard/estimates/store";
import { ModelImage } from "@/components/dashboard/models/model-image";
import type {
	PortalEstimateSummary,
	PortalServiceOrderSummary,
} from "@/lib/services/portal";
import { cn } from "@/lib/utils";
import { PortalProgressBar } from "./portal-progress";
import { PortalStatusBadge } from "./portal-status-badge";

export const ESTIMATE_TONE = {
	draft: "bg-muted text-muted-foreground",
	sent: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
	approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
	rejected: "bg-red-500/15 text-red-700 dark:text-red-300",
} as const;

/** One surface holding rows, instead of a card per item. */
export function PortalList({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<ul
			className={cn(
				"divide-y overflow-hidden rounded-2xl bg-card shadow-[0_0_0_1px_oklch(0_0_0/0.06),0_1px_2px_oklch(0_0_0/0.04)] dark:shadow-[0_0_0_1px_oklch(1_0_0/0.08)]",
				className
			)}
		>
			{children}
		</ul>
	);
}

const row =
	"group flex gap-3 px-4 py-3.5 transition-[background-color] duration-150 ease-out hover:bg-muted/50 active:bg-muted";

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
					"size-5 shrink-0 rounded-md bg-background object-contain outline outline-1 outline-black/10 -outline-offset-1 dark:outline-white/10",
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

/** `Shop · CODE` on one line, the shop name truncating first. */
function ShopLine({
	shop,
	code,
}: {
	shop: { name: string; logoUrl: string | null };
	code: string;
}) {
	return (
		<p className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-muted-foreground text-xs">
			<ShopMark className="size-4" shop={shop} />
			<span className="truncate">{shop.name}</span>
			<span aria-hidden>·</span>
			<span className="shrink-0 tabular-nums">{code}</span>
		</p>
	);
}

/** The warning line of something that waits for the customer. */
export function WaitingForYou({ children }: { children: ReactNode }) {
	return (
		<p className="flex items-center gap-1.5 whitespace-nowrap font-medium text-amber-700 text-xs dark:text-amber-300">
			<HandCoins className="size-3.5 shrink-0" />
			<span className="truncate">{children}</span>
		</p>
	);
}

/** One repair: the device, the shop, where it stands and how far it is. */
export function PortalServiceOrderRow({
	order,
}: {
	order: PortalServiceOrderSummary;
}) {
	const { t, format } = useTranslation();

	return (
		<li>
			<Link className={row} href={`/portal/service-orders/${order.id}`}>
				<ModelImage
					alt={order.deviceModel}
					category={order.deviceCategory}
					className="size-12 rounded-xl"
					src={order.deviceImageUrl}
				/>
				<div className="min-w-0 flex-1 space-y-1.5">
					<div className="flex items-center justify-between gap-2">
						<p className="truncate font-medium">{order.deviceModel}</p>
						<PortalStatusBadge status={order.status} />
					</div>
					<ShopLine code={order.code} shop={order.company} />
					<PortalProgressBar status={order.status} />
					{order.pendingEstimate ? (
						<WaitingForYou>{t("portal.list.pendingEstimate")}</WaitingForYou>
					) : (
						<p className="truncate whitespace-nowrap text-muted-foreground text-xs">
							{t("portal.list.updated", {
								time: format.relativeTime(order.updatedAt),
							})}
						</p>
					)}
				</div>
				<ChevronRight className="mt-0.5 size-4 shrink-0 self-center text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
			</Link>
		</li>
	);
}

/** One estimate: the shop, the device, the total and whether it waits for an answer. */
export function PortalEstimateRow({
	estimate,
}: {
	estimate: PortalEstimateSummary;
}) {
	const { t, format } = useTranslation();
	const days = daysUntil(estimate.validUntil);
	const open = estimate.status === "sent" && !estimate.expired;
	const expired = estimate.expired && estimate.status === "sent";

	return (
		<li>
			<Link className={row} href={`/portal/estimates/${estimate.id}`}>
				<ModelImage
					alt={estimate.deviceModel}
					category={estimate.deviceCategory}
					className="size-12 rounded-xl"
					src={estimate.deviceImageUrl}
				/>
				<div className="min-w-0 flex-1 space-y-1">
					<div className="flex items-baseline justify-between gap-2">
						<p className="truncate font-medium">{estimate.deviceModel}</p>
						<p className="shrink-0 font-heading font-semibold text-lg">
							{format.currency(estimate.totals.total)}
						</p>
					</div>
					<ShopLine
						code={`#${String(estimate.number).padStart(4, "0")}`}
						shop={estimate.company}
					/>
					{open ? (
						<WaitingForYou>
							{t("portal.estimates.pending")}
							{days <= 7 &&
								` · ${t("portal.estimates.validUntil", {
									date: format.date(estimate.validUntil),
								})}`}
						</WaitingForYou>
					) : (
						<span
							className={cn(
								"inline-flex rounded-full px-2 py-0.5 font-medium text-xs",
								expired
									? "bg-muted text-muted-foreground"
									: ESTIMATE_TONE[estimate.status]
							)}
						>
							{expired
								? t("portal.estimates.expired")
								: t(`estimates.status.${estimate.status}`)}
						</span>
					)}
				</div>
				<ChevronRight className="size-4 shrink-0 self-center text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
			</Link>
		</li>
	);
}
