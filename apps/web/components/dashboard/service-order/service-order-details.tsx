"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { ArrowLeft, Wrench } from "lucide-react";
import { Heading } from "@/components/dashboard/heading";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ServiceOrderDetail } from "@/lib/services/service-orders";
import { DashLink } from "./dash-link";
import { ServiceOrderDetailsLayout } from "./layout";
import { useOrderCode, useServiceOrder } from "./store";
import { MoveStatusDialog } from "./widgets/move-status-dialog";

/** The order's main actions, next to its title. */
export function ServiceOrderActions({ order }: { order: ServiceOrderDetail }) {
	const ability = useCatalogAbility();

	return (
		<div className="flex flex-wrap gap-2">
			{ability.can(permissions.serviceOrders.changeStatus) && (
				<MoveStatusDialog order={order} />
			)}
		</div>
	);
}

export function ServiceOrderDetails({
	id,
	subdomain,
}: {
	id: string;
	subdomain: string;
}) {
	const { t } = useTranslation();
	const query = useServiceOrder(id);
	const order = query.data;
	const orderCode = useOrderCode();

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3">
				<Button
					asChild
					className="-mt-3 w-fit -translate-x-2.5"
					size="sm"
					variant="ghost"
				>
					<DashLink href="/service-orders" subdomain={subdomain}>
						<ArrowLeft className="size-4" />
						{t("serviceOrders.detail.back")}
					</DashLink>
				</Button>

				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<Heading
						description={t("serviceOrders.detail.description")}
						title={
							<>
								<Wrench className="mr-2.5 inline-block size-6.5 -translate-y-1 fill-primary text-primary" />
								{t("serviceOrders.detail.title")}{" "}
								{order && (
									<span className="font-(family-name:--font-inter) font-medium">
										{orderCode(order.number)}
									</span>
								)}
							</>
						}
					/>
					{order && <ServiceOrderActions order={order} />}
				</div>
			</div>

			{query.isPending && <Skeleton className="h-96 w-full rounded-md" />}
			{!(query.isPending || order) && (
				<p className="text-muted-foreground text-sm">
					{t("serviceOrders.detail.notFound")}
				</p>
			)}
			{order && (
				<ServiceOrderDetailsLayout order={order} subdomain={subdomain} />
			)}
		</div>
	);
}
