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
import {
	ESTIMATE_TONE,
	PortalList,
	ShopMark,
	WaitingForYou,
} from "./portal-cards";
import { PortalProgressBar, PortalTimeline } from "./portal-progress";
import { PortalStatusBadge } from "./portal-status-badge";
import { usePortalServiceOrder } from "./store";

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="space-y-2.5">
			<h2 className="font-semibold text-sm">{title}</h2>
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
		<Button
			asChild
			className="mb-3 -ml-2.5 transition-[scale] active:scale-[0.96]"
			size="sm"
			variant="ghost"
		>
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
				<Skeleton className="h-24 rounded-2xl" />
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
				<p className="py-12 text-center text-muted-foreground text-sm">
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
			<Hero order={order} />
			<div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_18rem]">
				<div className="min-w-0 space-y-7">
					<Section title={t("portal.detail.reportedDefect")}>
						<blockquote className="text-pretty border-l-2 pl-3 text-sm">
							{order.reportedDefect}
						</blockquote>
					</Section>
					<EstimatesSection order={order} />
					{order.items.length > 0 ? (
						<ItemsSection
							estimate={itemsSummary(order.items)}
							title={t("portal.detail.items")}
						/>
					) : (
						<Section title={t("portal.detail.items")}>
							<p className="text-muted-foreground text-sm">
								{t("portal.detail.noItems")}
							</p>
						</Section>
					)}
				</div>
				<div className="space-y-7">
					<Section title={t("portal.detail.progress")}>
						<div>
							<PortalTimeline history={order.history} status={order.status} />
						</div>
					</Section>
					<ContactSection company={order.company} />
				</div>
			</div>
		</div>
	);
}

function Hero({ order }: { order: Order }) {
	const { t, format } = useTranslation();

	return (
		<header className="space-y-4">
			<div className="flex items-center gap-4">
				<ModelImage
					alt={order.deviceModel}
					category={order.deviceCategory}
					className="size-20 rounded-2xl"
					loading="eager"
					src={order.deviceImageUrl}
				/>
				<div className="min-w-0 flex-1">
					<h1 className="truncate font-heading font-semibold text-2xl">
						{order.deviceModel}
					</h1>
					<p className="truncate text-muted-foreground text-sm">
						{order.deviceMaker}
					</p>
					<p className="mt-1 flex min-w-0 items-center gap-1.5 whitespace-nowrap text-muted-foreground text-xs">
						<ShopMark className="size-4" shop={order.company} />
						<span className="truncate">{order.company.name}</span>
						<span aria-hidden>·</span>
						<span className="shrink-0">{order.code}</span>
					</p>
				</div>
			</div>
			<div className="space-y-2">
				<div className="flex items-center justify-between gap-2">
					<PortalStatusBadge status={order.status} />
					<span className="truncate whitespace-nowrap text-muted-foreground text-xs">
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

function EstimatesSection({ order }: { order: Order }) {
	const { t, format } = useTranslation();

	return (
		<Section title={t("portal.detail.estimates")}>
			{order.estimates.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					{t("portal.detail.noEstimates")}
				</p>
			) : (
				<PortalList>
					{order.estimates.map((estimate) => {
						const expired = estimate.expired && estimate.status === "sent";
						const open = estimate.status === "sent" && !estimate.expired;
						return (
							<li key={estimate.id}>
								<Link
									className="group flex items-center gap-3 px-4 py-3 transition-[background-color] duration-150 ease-out hover:bg-muted/50"
									href={`/portal/estimates/${estimate.id}`}
								>
									<div className="min-w-0 flex-1 space-y-1">
										<p className="truncate font-medium text-sm">
											{t("portal.detail.estimateNumber", {
												number: String(estimate.number).padStart(4, "0"),
											})}
										</p>
										{open ? (
											<WaitingForYou>
												{t("portal.estimates.pending")}
											</WaitingForYou>
										) : (
											<span
												className={cn(
													"inline-flex whitespace-nowrap rounded-full px-2 py-0.5 font-medium text-xs",
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
									<span className="shrink-0 font-semibold text-sm tabular-nums">
										{format.currency(estimate.totals.total)}
									</span>
									<ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
								</Link>
							</li>
						);
					})}
				</PortalList>
			)}
		</Section>
	);
}
