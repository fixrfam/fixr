"use client";

import { useTranslation } from "@fixr/i18n/react";
import { ExternalLink } from "lucide-react";
import { DashLink } from "@/components/dashboard/service-order/dash-link";
import { ServiceOrderStatusBadge } from "@/components/dashboard/service-order/service-order-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCpf, formatPhone } from "@/lib/format";
import { serviceOrderStatusKeys } from "@/lib/i18n/labels";
import type {
	ServiceOrderRow,
	ServiceOrderStatus,
} from "@/lib/services/service-orders";
import { orderNumber } from "../order-number";

export function OrderNumberCell({
	id,
	createdAt,
}: {
	id: string;
	createdAt: string;
}) {
	const { format } = useTranslation();

	return (
		<div className="flex flex-col">
			<span className="font-semibold tabular-nums">
				#{orderNumber(id)} <ExternalLink className="inline-block size-3.5" />
			</span>
			<span className="text-muted-foreground text-xs">
				{format.date(createdAt)}
			</span>
		</div>
	);
}

export function ClientCell({ client }: { client: ServiceOrderRow["client"] }) {
	return (
		<div className="flex flex-col">
			<span className="font-medium">{client.name}</span>
			<span className="text-muted-foreground text-xs">
				{formatPhone(client.phone)}
			</span>
			<span className="text-muted-foreground text-xs tabular-nums">
				{formatCpf(client.cpf)}
			</span>
		</div>
	);
}

export function DeviceCell({ order }: { order: ServiceOrderRow }) {
	return (
		<div className="flex flex-col">
			<span className="font-medium">{order.model.name}</span>
			<span className="text-muted-foreground text-xs">
				{order.deviceMaker.name}
			</span>
			{order.device.imei && (
				<span className="text-muted-foreground text-xs tabular-nums">
					{order.device.imei}
				</span>
			)}
		</div>
	);
}

export function CategoryCell({ category }: { category?: string }) {
	return category ? <Badge variant="outline">{category}</Badge> : null;
}

export function StatusCell({ status }: { status: ServiceOrderStatus }) {
	const { t } = useTranslation();

	return (
		<ServiceOrderStatusBadge
			className="rounded-lg px-2.5 py-1 font-semibold"
			variant={status}
		>
			{t(serviceOrderStatusKeys[status])}
		</ServiceOrderStatusBadge>
	);
}

export function IssueCell({
	description,
	notes,
}: {
	description: string;
	notes?: string | null;
}) {
	return (
		<div className="flex max-w-64 flex-col">
			<span className="line-clamp-2 text-xs">{description}</span>
			{notes && (
				<span className="line-clamp-1 text-muted-foreground text-xs">
					{notes}
				</span>
			)}
		</div>
	);
}

export function ActionsCell({
	id,
	subdomain,
}: {
	id: string;
	subdomain: string;
}) {
	const { t } = useTranslation();

	return (
		<div className="text-right">
			<Button
				asChild
				onClick={(e) => e.stopPropagation()}
				size="sm"
				type="button"
				variant="outline"
			>
				<DashLink href={`/service-orders/${id}`} subdomain={subdomain}>
					{t("common.actions.seeMore")}
				</DashLink>
			</Button>
		</div>
	);
}
