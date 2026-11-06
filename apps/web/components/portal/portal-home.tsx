"use client";

import { useTranslation } from "@fixr/i18n/react";
import { ArrowRight, PackageCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalEstimateCard, PortalServiceOrderCard } from "./portal-cards";
import { usePortalEstimates, usePortalServiceOrders } from "./store";

function Section({
	title,
	action,
	children,
}: {
	title: string;
	action?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section className="space-y-3">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-sm">{title}</h2>
				{action}
			</div>
			{children}
		</section>
	);
}

/** The client's home: what needs an answer, what is ready, what is moving. */
export function PortalHome() {
	const { t } = useTranslation();
	const orders = usePortalServiceOrders();
	const estimates = usePortalEstimates();

	if (orders.isPending || estimates.isPending) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-5 w-64" />
				<div className="grid grid-cols-3 gap-2">
					<Skeleton className="h-20 rounded-2xl" />
					<Skeleton className="h-20 rounded-2xl" />
					<Skeleton className="h-20 rounded-2xl" />
				</div>
				<Skeleton className="h-36 rounded-2xl" />
				<Skeleton className="h-36 rounded-2xl" />
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

	return (
		<div className="space-y-7">
			<p className="text-muted-foreground text-sm">
				{t("portal.home.subtitle")}
			</p>

			<dl className="grid grid-cols-3 gap-2">
				{[
					{
						label: t("portal.home.stats.pending"),
						value: pending.length,
						tone: "text-amber-600 dark:text-amber-400",
					},
					{
						label: t("portal.home.stats.active"),
						value: active.length,
						tone: "text-primary",
					},
					{
						label: t("portal.home.stats.ready"),
						value: ready.length,
						tone: "text-emerald-600 dark:text-emerald-400",
					},
				].map((stat) => (
					<div
						className="rounded-2xl border bg-card px-3 py-3"
						key={stat.label}
					>
						<dd
							className={`font-heading font-semibold text-2xl tabular-nums ${stat.tone}`}
						>
							{stat.value}
						</dd>
						<dt className="text-muted-foreground text-xs">{stat.label}</dt>
					</div>
				))}
			</dl>

			{all.length === 0 && pending.length === 0 && (
				<div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
					<span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
						<Smartphone className="size-7" />
					</span>
					<p className="mt-4 font-semibold">{t("portal.home.emptyTitle")}</p>
					<p className="mt-1 max-w-xs text-muted-foreground text-sm">
						{t("portal.home.emptyDescription")}
					</p>
				</div>
			)}

			{pending.length > 0 && (
				<Section title={t("portal.home.pendingTitle")}>
					<div className="grid gap-3">
						{pending.map((estimate) => (
							<PortalEstimateCard
								estimate={estimate}
								highlight
								key={estimate.id}
							/>
						))}
					</div>
				</Section>
			)}

			{ready.length > 0 && (
				<Section title={t("portal.home.readyTitle")}>
					<div className="grid gap-3">
						{ready.map((order) => (
							<Link
								className="flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-card to-card p-4"
								href={`/portal/service-orders/${order.id}`}
								key={order.id}
							>
								<span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white">
									<PackageCheck className="size-5" />
								</span>
								<p className="min-w-0 flex-1 text-sm">
									{t("portal.home.readyDescription", {
										device: order.deviceModel,
										shop: order.company.name,
									})}
								</p>
								<ArrowRight className="size-4 shrink-0 text-muted-foreground" />
							</Link>
						))}
					</div>
				</Section>
			)}

			{active.length > 0 && (
				<Section
					action={
						<Link
							className="text-primary text-xs"
							href="/portal/service-orders"
						>
							{t("portal.home.seeAll")}
						</Link>
					}
					title={t("portal.home.activeTitle")}
				>
					<div className="grid gap-3 sm:grid-cols-2">
						{active.map((order) => (
							<PortalServiceOrderCard key={order.id} order={order} />
						))}
					</div>
				</Section>
			)}

			{recent.length > 0 && (
				<Section title={t("portal.home.recentTitle")}>
					<div className="grid gap-3 sm:grid-cols-2">
						{recent.map((order) => (
							<PortalServiceOrderCard key={order.id} order={order} />
						))}
					</div>
				</Section>
			)}
		</div>
	);
}
