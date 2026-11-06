"use client";

import { useTranslation } from "@fixr/i18n/react";
import {
	ClipboardList,
	ExternalLink,
	FileUser,
	Mail,
	Package,
	Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { CustomerAvatar } from "@/components/dashboard/customers/customer-avatar";
import { ModelImage } from "@/components/dashboard/models/model-image";
import { DashLink } from "@/components/dashboard/service-order/dash-link";
import { ServiceOrderDetailsCard } from "@/components/dashboard/service-order/service-order-details-card";
import { useOrderCode } from "@/components/dashboard/service-order/store";
import { groupItems } from "@/components/dashboard/service-order/widgets/service-order-items";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPhone } from "@/lib/format";
import type { EstimateDetail, EstimateItem } from "@/lib/services/estimates";
import { cn } from "@/lib/utils";
import {
	NEXT_STATUSES,
	useEstimatePermissions,
	useStatusActions,
} from "./estimate-actions";
import { EstimatePdfViewer } from "./estimate-pdf-viewer";
import { EstimateStatusBadge } from "./estimate-status-badge";
import { SendEstimateDialog } from "./send-estimate-dialog";
import { EstimateValidityCell } from "./table/cells";
import { useEstimateActions } from "./use-estimate-actions";

/**
 * Everything about an estimate at a glance: its state and values, the
 * client, the order it came from, the items, the actions and the PDF.
 */
export function EstimateDetails({
	estimate,
	actions,
	className,
}: {
	estimate: EstimateDetail;
	/** Extra actions shown before the status changes (e.g. sending). */
	actions?: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]",
				className
			)}
		>
			<div className="min-w-0 space-y-4">
				<EstimateSummary estimate={estimate} />
				<EstimateActionsBar estimate={estimate}>{actions}</EstimateActionsBar>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
					<ClientCard estimate={estimate} />
					<OrderCard estimate={estimate} />
				</div>
				<ItemsCard estimate={estimate} />
			</div>
			<div className="min-h-[28rem] lg:sticky lg:top-0 lg:h-[min(80dvh,56rem)]">
				<EstimatePdfViewer estimate={estimate} />
			</div>
		</div>
	);
}

function EstimateSummary({ estimate }: { estimate: EstimateDetail }) {
	const { t, format } = useTranslation();

	return (
		<div className="rounded-lg border bg-muted/20 p-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="space-y-1">
					<EstimateStatusBadge
						className="rounded-lg px-2.5 py-1 font-semibold"
						status={estimate.status}
					/>
					<p className="text-2xs text-muted-foreground">
						{t("estimates.detail.createdAt")}{" "}
						{format.dateTime(estimate.createdAt)}
					</p>
				</div>
				<div className="text-right">
					<p className="font-heading font-semibold text-3xl tabular-nums">
						{format.currency(estimate.totals.total)}
					</p>
					{estimate.discountPercentage > 0 && (
						<p className="text-2xs text-muted-foreground tabular-nums">
							<s>{format.currency(estimate.totals.subtotal)}</s>{" "}
							<span className="text-emerald-700 dark:text-emerald-300">
								{t("estimates.table.discount", {
									percentage: format.number(estimate.discountPercentage),
								})}
							</span>
						</p>
					)}
				</div>
			</div>
			<dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-2xs sm:grid-cols-3">
				<div>
					<dt className="text-muted-foreground">
						{t("estimates.detail.validUntil")}
					</dt>
					<dd>
						<EstimateValidityCell estimate={estimate} />
					</dd>
				</div>
				<div>
					<dt className="text-muted-foreground">
						{t("estimates.detail.items")}
					</dt>
					<dd className="text-xs tabular-nums">{estimate.itemsCount}</dd>
				</div>
			</dl>
			{estimate.rejectionReason && (
				<div className="mt-3 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-2xs">
					<p className="font-medium text-red-700 dark:text-red-300">
						{t("estimates.detail.rejectionReason")}
					</p>
					<p className="mt-0.5 whitespace-pre-line">
						{estimate.rejectionReason}
					</p>
				</div>
			)}
			{estimate.notes && (
				<div className="mt-3 text-2xs">
					<p className="text-muted-foreground">{t("estimates.detail.notes")}</p>
					<p className="whitespace-pre-line">{estimate.notes}</p>
				</div>
			)}
		</div>
	);
}

function EstimateActionsBar({
	estimate,
	children,
}: {
	estimate: EstimateDetail;
	children?: ReactNode;
}) {
	const { t } = useTranslation();
	const router = useRouter();
	const { updateStatus, remove } = useEstimateActions();
	const statusActions = useStatusActions();
	const { canUpdate, canDelete, canSend } = useEstimatePermissions(estimate);
	const next = canUpdate ? NEXT_STATUSES[estimate.status] : [];
	const [sending, setSending] = useState(false);

	if (!(children || canSend || next.length > 0 || canDelete)) {
		return null;
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			{children}
			{canSend && (
				<>
					<Button onClick={() => setSending(true)} size="sm">
						<Mail className="size-3.5" />
						{estimate.status === "sent"
							? t("estimates.actions.resendToClient")
							: t("estimates.actions.sendToClient")}
					</Button>
					{sending && (
						<SendEstimateDialog
							estimate={estimate}
							onOpenChange={setSending}
							open={sending}
						/>
					)}
				</>
			)}
			{next.map((status) => {
				const { label, Icon } = statusActions[status];
				return (
					<Button
						disabled={updateStatus.isPending}
						key={status}
						onClick={() => updateStatus.mutate({ id: estimate.id, status })}
						size="sm"
						variant="outline"
					>
						<Icon className="size-3.5" />
						{label}
					</Button>
				);
			})}
			{canDelete && (
				<Button
					className="text-destructive hover:text-destructive"
					disabled={remove.isPending}
					onClick={() =>
						remove.mutate(estimate.id, { onSuccess: () => router.back() })
					}
					size="sm"
					variant="ghost"
				>
					<Trash2 className="size-3.5" />
					{t("estimates.actions.delete")}
				</Button>
			)}
		</div>
	);
}

function ClientCard({ estimate }: { estimate: EstimateDetail }) {
	const { t } = useTranslation();
	const { subdomain } = useParams<{ subdomain: string }>();
	const { client } = estimate;

	return (
		<ServiceOrderDetailsCard
			action={
				client && (
					<Button asChild size="sm" variant="ghost">
						<DashLink href={`/customers/${client.id}`} subdomain={subdomain}>
							{t("estimates.detail.openClient")}
							<ExternalLink className="size-3" />
						</DashLink>
					</Button>
				)
			}
			icon={FileUser}
			title={t("estimates.detail.client")}
		>
			{client ? (
				<div className="flex items-center gap-3">
					<CustomerAvatar className="size-10" customer={client} />
					<div className="min-w-0 text-2xs">
						<p className="truncate font-medium text-sm">{client.name}</p>
						{client.phone && (
							<p className="text-muted-foreground">
								{formatPhone(client.phone)}
							</p>
						)}
						{client.email && (
							<p className="truncate text-muted-foreground">{client.email}</p>
						)}
					</div>
				</div>
			) : (
				<p className="text-2xs text-muted-foreground">
					{t("estimates.table.noClient")}
				</p>
			)}
		</ServiceOrderDetailsCard>
	);
}

function OrderCard({ estimate }: { estimate: EstimateDetail }) {
	const { t } = useTranslation();
	const { subdomain } = useParams<{ subdomain: string }>();
	const orderCode = useOrderCode();
	const { device, serviceOrder } = estimate;

	return (
		<ServiceOrderDetailsCard
			action={
				<Button asChild size="sm" variant="ghost">
					<DashLink
						href={`/service-orders/${serviceOrder.id}`}
						subdomain={subdomain}
					>
						{t("estimates.detail.openOrder")}
						<ExternalLink className="size-3" />
					</DashLink>
				</Button>
			}
			icon={ClipboardList}
			title={t("estimates.detail.serviceOrder")}
		>
			<div className="flex items-center gap-3">
				<ModelImage
					alt={device.model.name}
					category={device.category}
					className="size-10"
					src={device.model.imageUrl}
				/>
				<div className="min-w-0 text-2xs">
					<p className="font-medium text-sm tabular-nums">
						{orderCode(serviceOrder.number)}
					</p>
					<p className="truncate text-muted-foreground">
						{device.maker} · {device.model.name}
					</p>
				</div>
			</div>
		</ServiceOrderDetailsCard>
	);
}

function ItemsCard({ estimate }: { estimate: EstimateDetail }) {
	const { t, format } = useTranslation();

	return (
		<ServiceOrderDetailsCard icon={Package} title={t("estimates.detail.items")}>
			<ul className="space-y-1.5">
				{groupItems(estimate.items).map(({ item, parts }) => (
					<li className="rounded-md border bg-card" key={item.id}>
						<ItemLine item={item} />
						{parts.length > 0 && (
							<ul className="ml-4 border-l pb-1">
								{parts.map((part) => (
									<li key={part.id}>
										<ItemLine item={part} nested />
									</li>
								))}
							</ul>
						)}
					</li>
				))}
			</ul>
			<dl className="mt-3 space-y-1 border-t pt-3 text-2xs">
				<div className="flex justify-between text-muted-foreground">
					<dt>{t("serviceOrders.items.partsTotal")}</dt>
					<dd className="tabular-nums">
						{format.currency(estimate.totals.parts)}
					</dd>
				</div>
				<div className="flex justify-between text-muted-foreground">
					<dt>{t("serviceOrders.items.servicesTotal")}</dt>
					<dd className="tabular-nums">
						{format.currency(estimate.totals.services)}
					</dd>
				</div>
				{estimate.totals.discount > 0 && (
					<div className="flex justify-between text-emerald-700 dark:text-emerald-300">
						<dt>
							{t("estimates.pdf.discount", {
								percentage: format.number(estimate.discountPercentage),
							})}
						</dt>
						<dd className="tabular-nums">
							−{format.currency(estimate.totals.discount)}
						</dd>
					</div>
				)}
				<div className="flex justify-between font-semibold text-sm">
					<dt>{t("estimates.pdf.total")}</dt>
					<dd className="tabular-nums">
						{format.currency(estimate.totals.total)}
					</dd>
				</div>
			</dl>
		</ServiceOrderDetailsCard>
	);
}

function ItemLine({
	item,
	nested = false,
}: {
	item: EstimateItem;
	nested?: boolean;
}) {
	const { t, format } = useTranslation();

	return (
		<div
			className={cn(
				"flex items-center gap-3 px-3 py-2 text-2xs",
				nested && "py-1.5"
			)}
		>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="wrap-break-words font-medium">{item.name}</span>
					<Badge className="text-[0.625rem]" variant="secondary">
						{item.type === "part"
							? t("serviceOrders.items.part")
							: t("serviceOrders.items.service")}
					</Badge>
				</div>
				<span className="text-muted-foreground tabular-nums">
					{item.quantity} × {format.currency(item.unitPrice)}
				</span>
			</div>
			<span className="font-medium tabular-nums">
				{format.currency(item.total)}
			</span>
		</div>
	);
}
