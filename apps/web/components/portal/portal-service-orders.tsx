"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalServiceOrderCard } from "./portal-cards";
import { PortalPageTitle } from "./portal-shell";
import { usePortalServiceOrders } from "./store";

/** Every repair of the client, the ones still moving first. */
export function PortalServiceOrders() {
	const { t } = useTranslation();
	const { data, isPending } = usePortalServiceOrders();
	const orders = data ?? [];
	const active = orders.filter((order) => order.status !== "delivered");
	const finished = orders.filter((order) => order.status === "delivered");

	return (
		<div>
			<PortalPageTitle
				description={t("portal.list.description")}
				title={t("portal.list.title")}
			/>
			{isPending && (
				<div className="grid gap-3">
					<Skeleton className="h-36 rounded-2xl" />
					<Skeleton className="h-36 rounded-2xl" />
				</div>
			)}
			{!isPending && orders.length === 0 && (
				<p className="rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground text-sm">
					{t("portal.list.empty")}
				</p>
			)}
			{[
				{ title: t("portal.list.active"), list: active },
				{ title: t("portal.list.finished"), list: finished },
			]
				.filter((group) => group.list.length > 0)
				.map((group) => (
					<section className="mb-7 space-y-3" key={group.title}>
						<h2 className="font-semibold text-sm">{group.title}</h2>
						<div className="grid gap-3 sm:grid-cols-2">
							{group.list.map((order) => (
								<PortalServiceOrderCard key={order.id} order={order} />
							))}
						</div>
					</section>
				))}
		</div>
	);
}
