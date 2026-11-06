"use client";

import { useTranslation } from "@fixr/i18n/react";
import { ChevronRight, HandCoins } from "lucide-react";
import { useParams } from "next/navigation";
import { DashLink } from "@/components/dashboard/service-order/dash-link";
import { ServiceOrderDetailsCard } from "@/components/dashboard/service-order/service-order-details-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EstimateStatusBadge } from "./estimate-status-badge";
import { formatEstimateNumber, useEstimatesPage } from "./store";

/** The estimates made from a service order, newest first, each opening its details. */
export function ServiceOrderEstimates({
	serviceOrderId,
}: {
	serviceOrderId: string;
}) {
	const { t, format } = useTranslation();
	const { subdomain } = useParams<{ subdomain: string }>();
	const { data, isPending, isError } = useEstimatesPage({
		page: 1,
		perPage: 50,
		serviceOrderId,
	});
	const estimates = data?.records ?? [];

	let body = (
		<ul className="space-y-1.5">
			{estimates.map((estimate) => (
				<li key={estimate.id}>
					<DashLink
						className="group flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-2xs transition-colors hover:border-primary/50"
						href={`/estimates/${estimate.id}`}
						subdomain={subdomain}
					>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<span className="font-semibold text-xs tabular-nums">
									{formatEstimateNumber(estimate.number)}
								</span>
								<EstimateStatusBadge status={estimate.status} />
							</div>
							<span className="text-muted-foreground">
								{format.date(estimate.createdAt)} ·{" "}
								{estimate.itemsCount === 1
									? t("estimates.table.itemsCountOne")
									: t("estimates.table.itemsCount", {
											count: estimate.itemsCount,
										})}
							</span>
						</div>
						<span className="font-medium text-xs tabular-nums">
							{format.currency(estimate.totals.total)}
						</span>
						<ChevronRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
					</DashLink>
				</li>
			))}
		</ul>
	);
	if (isPending) {
		body = <Skeleton className="h-16 w-full" />;
	} else if (isError) {
		body = (
			<p className="text-2xs text-muted-foreground">
				{t("messages.fallback.error.description")}
			</p>
		);
	} else if (estimates.length === 0) {
		body = (
			<p className="text-2xs text-muted-foreground">
				{t("estimates.serviceOrderCard.empty")}
			</p>
		);
	}

	return (
		<ServiceOrderDetailsCard
			description={t("estimates.serviceOrderCard.description")}
			icon={HandCoins}
			title={t("estimates.serviceOrderCard.title")}
		>
			{body}
		</ServiceOrderDetailsCard>
	);
}
