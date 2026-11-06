"use client";

import { useTranslation } from "@fixr/i18n/react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ModelImage } from "@/components/dashboard/models/model-image";
import {
	ContactSection,
	ItemsSection,
} from "@/components/estimates/customer-estimate";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PortalServiceOrder as Order } from "@/lib/services/portal";
import { cn } from "@/lib/utils";
import { ShopMark } from "./portal-cards";
import { PortalProgressBar, PortalTimeline } from "./portal-progress";
import { PortalStatusBadge } from "./portal-status-badge";
import { usePortalServiceOrder } from "./store";

const ESTIMATE_TONE = {
	draft: "bg-muted text-muted-foreground",
	sent: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
	approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
	rejected: "bg-red-500/15 text-red-700 dark:text-red-300",
} as const;

function Card({
	title,
	children,
	className,
}: {
	title: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<section className={cn("rounded-2xl border bg-card p-4", className)}>
			<h2 className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
				{title}
			</h2>
			{children}
		</section>
	);
}

/** The order's lines as the items section reads them: no discount on an order. */
function itemsSummary(items: Order["items"]) {
	const sum = (lines: Order["items"]) =>
		lines.reduce((cents, line) => cents + Math.round(line.total * 100), 0) /
		100;
	const total = sum(items);
	return {
		items,
		discountPercentage: 0,
		totals: {
			parts: sum(items.filter((item) => item.type === "part")),
			services: sum(items.filter((item) => item.type === "service")),
			subtotal: total,
			discount: 0,
			total,
		},
	};
}

export function PortalBackLink({
	href,
	label,
}: {
	href: string;
	label: string;
}) {
	return (
		<Button asChild className="mb-3 -ml-2.5" size="sm" variant="ghost">
			<Link href={href}>
				<ArrowLeft className="size-4" />
				{label}
			</Link>
		</Button>
	);
}

/** One repair for the customer: where it stands, what was found and what it costs. */
export function PortalServiceOrder({ id }: { id: string }) {
	const { t } = useTranslation();
	const { data: order, isPending } = usePortalServiceOrder(id);

	if (isPending) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-40 rounded-2xl" />
				<Skeleton className="h-72 rounded-2xl" />
			</div>
		);
	}

	if (!order) {
		return (
			<div>
				<PortalBackLink
					href="/portal/service-orders"
					label={t("portal.detail.back")}
				/>
				<p className="rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground text-sm">
					{t("portal.detail.notFound")}
				</p>
			</div>
		);
	}

	return (
		<div>
			<PortalBackLink
				href="/portal/service-orders"
				label={t("portal.detail.back")}
			/>
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
				<div className="min-w-0 space-y-4">
					<Hero order={order} />
					<Card title={t("portal.detail.reportedDefect")}>
						<p className="whitespace-pre-line text-sm">
							{order.reportedDefect}
						</p>
					</Card>
					<EstimatesCard order={order} />
					{order.items.length > 0 ? (
						<ItemsSection
							estimate={itemsSummary(order.items)}
							title={t("portal.detail.items")}
						/>
					) : (
						<Card title={t("portal.detail.items")}>
							<p className="text-muted-foreground text-sm">
								{t("portal.detail.noItems")}
							</p>
						</Card>
					)}
				</div>
				<div className="space-y-4">
					<Card title={t("portal.detail.progress")}>
						<PortalTimeline history={order.history} status={order.status} />
					</Card>
					<ContactSection company={order.company} />
				</div>
			</div>
		</div>
	);
}

function Hero({ order }: { order: Order }) {
	const { t, format } = useTranslation();

	return (
		<header className="overflow-hidden rounded-2xl border bg-card">
			<div className="flex items-center gap-4 p-4">
				<ModelImage
					alt={order.deviceModel}
					category={order.deviceCategory}
					className="size-20 rounded-2xl"
					loading="eager"
					src={order.deviceImageUrl}
				/>
				<div className="min-w-0 flex-1">
					<p className="font-heading font-semibold text-xl leading-tight">
						{order.deviceModel}
					</p>
					<p className="text-muted-foreground text-sm">{order.deviceMaker}</p>
					<p className="mt-1.5 flex items-center gap-1.5 text-muted-foreground text-xs">
						<ShopMark className="size-4" shop={order.company} />
						<span className="truncate">{order.company.name}</span>
						<span aria-hidden>·</span>
						<span className="tabular-nums">{order.code}</span>
					</p>
				</div>
			</div>
			<div className="space-y-2.5 border-t bg-muted/20 px-4 py-3">
				<div className="flex items-center justify-between gap-2">
					<PortalStatusBadge status={order.status} />
					<span className="text-muted-foreground text-xs">
						{t("portal.detail.openedAt", {
							date: format.date(order.createdAt),
						})}
					</span>
				</div>
				<PortalProgressBar status={order.status} />
			</div>
		</header>
	);
}

function EstimatesCard({ order }: { order: Order }) {
	const { t, format } = useTranslation();

	return (
		<Card title={t("portal.detail.estimates")}>
			{order.estimates.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					{t("portal.detail.noEstimates")}
				</p>
			) : (
				<ul className="-mx-1 space-y-1">
					{order.estimates.map((estimate) => {
						const expired = estimate.expired && estimate.status === "sent";
						return (
							<li key={estimate.id}>
								<Link
									className="group flex items-center gap-3 rounded-xl px-1 py-2 transition-colors hover:bg-muted/50"
									href={`/portal/estimates/${estimate.id}`}
								>
									<div className="min-w-0 flex-1">
										<p className="font-medium text-sm">
											{t("portal.detail.estimateNumber", {
												number: String(estimate.number).padStart(4, "0"),
											})}
										</p>
										<p className="text-muted-foreground text-xs">
											{t("portal.detail.validUntil", {
												date: format.date(estimate.validUntil),
											})}
										</p>
									</div>
									<span
										className={cn(
											"rounded-full px-2.5 py-0.5 font-medium text-xs",
											expired
												? "bg-muted text-muted-foreground"
												: ESTIMATE_TONE[estimate.status]
										)}
									>
										{expired
											? t("portal.estimates.expired")
											: t(`estimates.status.${estimate.status}`)}
									</span>
									<span className="font-semibold text-sm tabular-nums">
										{format.currency(estimate.totals.total)}
									</span>
									<ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
								</Link>
							</li>
						);
					})}
				</ul>
			)}
		</Card>
	);
}
