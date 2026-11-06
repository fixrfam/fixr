"use client";

import { useTranslation } from "@fixr/i18n/react";
import { ChevronRight, PackageCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
	PortalEstimateRow,
	PortalList,
	PortalServiceOrderRow,
} from "./portal-cards";
import { usePortalEstimates, usePortalServiceOrders } from "./store";

function Section({
	title,
	action,
	children,
	index = 0,
}: {
	title: string;
	action?: ReactNode;
	children: ReactNode;
	/** Position in the page, for the staggered entrance. */
	index?: number;
}) {
	return (
		<section
			className="fade-in-0 slide-in-from-bottom-2 animate-in space-y-2.5 duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] [animation-fill-mode:both] motion-reduce:animate-none"
			style={{ animationDelay: `${index * 60}ms` }}
		>
			<div className="flex items-center justify-between px-1">
				<h2 className="font-semibold text-sm">{title}</h2>
				{action}
			</div>
			{children}
		</section>
	);
}

/** The customer's home: what needs an answer, what is ready, what is moving. */
export function PortalHome() {
	const { t } = useTranslation();
	const orders = usePortalServiceOrders();
	const estimates = usePortalEstimates();

	if (orders.isPending || estimates.isPending) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-20 rounded-2xl" />
				<Skeleton className="h-44 rounded-2xl" />
			</div>
		);
	}

	const all = orders.data ?? [];
	const pending = (estimates.data ?? []).filter(
		(estimate) => estimate.status === "sent" && !estimate.expired
	);
	const ready = all.filter((order) => order.status === "ready");
	const active = all.filter(
		(order) => order.status !== "ready" && order.status !== "delivered"
	);
	const recent = all
		.filter((order) => order.status === "delivered")
		.slice(0, 3);
	const stats = [
		{
			label: t("portal.home.stats.pending"),
			value: pending.length,
			tone: pending.length > 0 && "text-amber-600 dark:text-amber-400",
		},
		{ label: t("portal.home.stats.active"), value: active.length, tone: "" },
		{
			label: t("portal.home.stats.ready"),
			value: ready.length,
			tone: ready.length > 0 && "text-emerald-600 dark:text-emerald-400",
		},
	];

	return (
		<div className="space-y-7">
			<div>
				<dl className="grid grid-cols-3 divide-x">
					{stats.map((stat) => (
						<div
							className="flex flex-col-reverse px-3 first:pl-1"
							key={stat.label}
						>
							<dt className="truncate text-muted-foreground text-xs">
								{stat.label}
							</dt>
							<dd
								className={cn("font-heading font-semibold text-3xl", stat.tone)}
							>
								{stat.value}
							</dd>
						</div>
					))}
				</dl>
			</div>

			{all.length === 0 && pending.length === 0 && (
				<div className="flex flex-col items-center px-6 py-12 text-center">
					<Smartphone className="size-8 text-muted-foreground" />
					<p className="mt-4 font-semibold">{t("portal.home.emptyTitle")}</p>
					<p className="mt-1 max-w-xs text-pretty text-muted-foreground text-sm">
						{t("portal.home.emptyDescription")}
					</p>
				</div>
			)}

			{pending.length > 0 && (
				<Section index={0} title={t("portal.home.pendingTitle")}>
					<PortalList>
						{pending.map((estimate) => (
							<PortalEstimateRow estimate={estimate} key={estimate.id} />
						))}
					</PortalList>
				</Section>
			)}

			{ready.length > 0 && (
				<Section index={1} title={t("portal.home.readyTitle")}>
					<PortalList>
						{ready.map((order) => (
							<li key={order.id}>
								<Link
									className="group flex items-center gap-3 px-4 py-3.5 transition-[background-color] duration-150 ease-out hover:bg-muted/50"
									href={`/portal/service-orders/${order.id}`}
								>
									<PackageCheck className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
									<p className="min-w-0 flex-1 truncate text-sm">
										{t("portal.home.readyDescription", {
											device: order.deviceModel,
											shop: order.company.name,
										})}
									</p>
									<ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
								</Link>
							</li>
						))}
					</PortalList>
				</Section>
			)}

			{active.length > 0 && (
				<Section
					action={
						<Link
							className="whitespace-nowrap text-primary text-xs hover:underline"
							href="/portal/service-orders"
						>
							{t("portal.home.seeAll")}
						</Link>
					}
					index={2}
					title={t("portal.home.activeTitle")}
				>
					<PortalList>
						{active.map((order) => (
							<PortalServiceOrderRow key={order.id} order={order} />
						))}
					</PortalList>
				</Section>
			)}

			{recent.length > 0 && (
				<Section index={3} title={t("portal.home.recentTitle")}>
					<PortalList>
						{recent.map((order) => (
							<PortalServiceOrderRow key={order.id} order={order} />
						))}
					</PortalList>
				</Section>
			)}
		</div>
	);
}
