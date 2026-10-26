"use client";

import { useTranslation } from "@fixr/i18n/react";
import { useQuery } from "@tanstack/react-query";
import { BellDot, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { deviceName } from "@/lib/format";
import { portalApi } from "@/lib/services/portal";
import { PortalHeader } from "./portal-header";
import { PortalStatusBadge } from "./portal-status-badge";
import { useRedirectWithoutSession } from "./use-portal-session";

export const portalServiceOrdersKey = ["portal", "service-orders"];

/** Every service order of the customer, in any shop. */
export function PortalHome() {
	const { t, format } = useTranslation();
	const { data, isPending, error } = useQuery({
		queryKey: portalServiceOrdersKey,
		queryFn: portalApi.serviceOrders,
		retry: false,
	});
	const redirecting = useRedirectWithoutSession(error);

	if (isPending || redirecting) {
		return <Skeleton className="h-96 w-full max-w-3xl rounded-lg" />;
	}

	return (
		<div className="w-full max-w-3xl space-y-6">
			<PortalHeader />
			{data && data.length > 0 ? (
				<ul className="space-y-3">
					{data.map((order) => (
						<li key={order.id}>
							<Link
								className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
								href={`/portal/service-orders/${order.id}`}
							>
								<div className="min-w-0 flex-1 space-y-1">
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-medium">
											{deviceName(order.deviceMaker, order.deviceModel)}
										</span>
										<PortalStatusBadge status={order.status} />
									</div>
									<p className="truncate text-muted-foreground text-sm">
										{order.company.name} ·{" "}
										{t("portal.list.openedAt", {
											date: format.date(order.createdAt),
										})}
									</p>
									{order.pendingEstimate ? (
										<p className="flex items-center gap-1 font-medium text-amber-700 text-sm dark:text-amber-300">
											<BellDot className="size-4" />
											{t("portal.list.pendingEstimate")}
										</p>
									) : null}
								</div>
								<ChevronRight
									aria-label={t("portal.list.details")}
									className="size-5 shrink-0 text-muted-foreground"
								/>
							</Link>
						</li>
					))}
				</ul>
			) : (
				<p className="rounded-lg border p-8 text-center text-muted-foreground">
					{t("portal.list.empty")}
				</p>
			)}
		</div>
	);
}
