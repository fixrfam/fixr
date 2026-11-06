"use client";

import { useTranslation } from "@fixr/i18n/react";
import { CustomerAvatar } from "@/components/dashboard/customers/customer-avatar";
import { ModelImage } from "@/components/dashboard/models/model-image";
import { DashLink } from "@/components/dashboard/service-order/dash-link";
import { useOrderCode } from "@/components/dashboard/service-order/store";
import { Badge } from "@/components/ui/badge";
import { formatPhone } from "@/lib/format";
import type { Estimate } from "@/lib/services/estimates";
import { cn } from "@/lib/utils";
import { daysUntil, formatEstimateNumber } from "../store";

/** Stops a click on a link inside a row from also opening the row. */
const stop = (event: React.MouseEvent) => event.stopPropagation();

export function EstimateNumberCell({ estimate }: { estimate: Estimate }) {
	const { format } = useTranslation();

	return (
		<div className="flex flex-col">
			<span className="whitespace-nowrap font-semibold tabular-nums">
				{formatEstimateNumber(estimate.number)}
			</span>
			<span className="text-muted-foreground text-xs">
				{format.date(estimate.createdAt)}
			</span>
		</div>
	);
}

export function EstimateClientCell({
	client,
	subdomain,
}: {
	client: Estimate["client"];
	subdomain: string;
}) {
	const { t } = useTranslation();

	if (!client) {
		return (
			<span className="text-muted-foreground text-xs">
				{t("estimates.table.noClient")}
			</span>
		);
	}

	return (
		<DashLink
			className="group/client flex items-center gap-2.5"
			href={`/customers/${client.id}`}
			onClick={stop}
			subdomain={subdomain}
		>
			<CustomerAvatar customer={client} />
			<div className="flex min-w-0 flex-col">
				<span className="font-medium group-hover/client:underline">
					{client.name}
				</span>
				{client.phone && (
					<span className="text-muted-foreground text-xs">
						{formatPhone(client.phone)}
					</span>
				)}
				{client.email && (
					<span className="max-w-48 truncate text-muted-foreground text-xs">
						{client.email}
					</span>
				)}
			</div>
		</DashLink>
	);
}

export function EstimateOrderCell({
	estimate,
	subdomain,
}: {
	estimate: Estimate;
	subdomain: string;
}) {
	const orderCode = useOrderCode();
	const { device, serviceOrder } = estimate;

	return (
		<DashLink
			className="group/order flex items-center gap-2.5"
			href={`/service-orders/${serviceOrder.id}`}
			onClick={stop}
			subdomain={subdomain}
		>
			<ModelImage
				alt={device.model.name}
				category={device.category}
				className="size-10"
				src={device.model.imageUrl}
			/>
			<div className="flex min-w-0 flex-col">
				<span className="whitespace-nowrap font-medium tabular-nums group-hover/order:underline">
					{orderCode(serviceOrder.number)}
				</span>
				<span className="truncate text-muted-foreground text-xs">
					{device.model.name}
				</span>
				<span className="text-muted-foreground text-xs">{device.maker}</span>
			</div>
		</DashLink>
	);
}

export function EstimateItemsCell({ count }: { count: number }) {
	const { t } = useTranslation();

	return (
		<Badge className="tabular-nums" variant="outline">
			{count === 1
				? t("estimates.table.itemsCountOne")
				: t("estimates.table.itemsCount", { count })}
		</Badge>
	);
}

export function EstimateTotalCell({ estimate }: { estimate: Estimate }) {
	const { t, format } = useTranslation();

	return (
		<div className="flex flex-col items-end">
			<span className="font-semibold tabular-nums">
				{format.currency(estimate.totals.total)}
			</span>
			{estimate.discountPercentage > 0 && (
				<span className="text-emerald-700 text-xs dark:text-emerald-300">
					{t("estimates.table.discount", {
						percentage: format.number(estimate.discountPercentage),
					})}
				</span>
			)}
		</div>
	);
}

/** The validity date and how close it is, while the client can still answer. */
export function EstimateValidityCell({ estimate }: { estimate: Estimate }) {
	const { t, format } = useTranslation();
	const days = daysUntil(estimate.validUntil);
	const pending = estimate.status === "draft" || estimate.status === "sent";

	let hint: string | null = null;
	if (pending) {
		if (days < 0) {
			hint = t("estimates.table.expired");
		} else if (days === 0) {
			hint = t("estimates.table.expiresToday");
		} else if (days === 1) {
			hint = t("estimates.table.expiresTomorrow");
		} else if (days <= 7) {
			hint = t("estimates.table.expiresIn", { days });
		}
	}

	return (
		<div className="flex flex-col">
			<span className="text-xs tabular-nums">
				{format.date(estimate.validUntil)}
			</span>
			{hint && (
				<span
					className={cn(
						"text-xs",
						days < 0 ? "text-destructive" : "text-amber-700 dark:text-amber-300"
					)}
				>
					{hint}
				</span>
			)}
		</div>
	);
}
