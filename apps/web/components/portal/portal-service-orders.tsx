"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalList, PortalServiceOrderRow } from "./portal-cards";
import { PortalPageTitle } from "./portal-shell";
import { usePortalServiceOrders } from "./store";

/** Every repair of the customer, the ones still moving first. */
export function PortalServiceOrders() {
	const { t } = useTranslation();
	const { data, isPending } = usePortalServiceOrders();
	const orders = data ?? [];
	const groups = [
		{
			title: t("portal.list.active"),
			list: orders.filter((order) => order.status !== "delivered"),
		},
		{
			title: t("portal.list.finished"),
			list: orders.filter((order) => order.status === "delivered"),
		},
	].filter((group) => group.list.length > 0);

	return (
		<div>
			<PortalPageTitle
				description={t("portal.list.description")}
				title={t("portal.list.title")}
			/>
			{isPending && <Skeleton className="h-44 rounded-2xl" />}
			{!isPending && orders.length === 0 && (
				<p className="py-12 text-center text-muted-foreground text-sm">
					{t("portal.list.empty")}
				</p>
			)}
			<div className="space-y-7">
				{groups.map((group) => (
					<section className="space-y-2.5" key={group.title}>
						<h2 className="px-1 font-semibold text-sm">{group.title}</h2>
						<PortalList>
							{group.list.map((order) => (
								<PortalServiceOrderRow key={order.id} order={order} />
							))}
						</PortalList>
					</section>
				))}
			</div>
		</div>
	);
}
