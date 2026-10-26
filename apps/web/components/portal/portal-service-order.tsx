"use client";

import { useMessage, useTranslation } from "@fixr/i18n/react";
import { toast } from "@pheralb/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, FileText, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EstimateStatusBadge } from "@/components/dashboard/estimates/estimate-status-badge";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { RejectDialog } from "@/components/estimates/public-estimate";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { deviceName, formatPhone } from "@/lib/format";
import {
	type PortalEstimate,
	portalApi,
	type PortalServiceOrder as ServiceOrder,
} from "@/lib/services/portal";
import { portalServiceOrdersKey } from "./portal-home";
import { PortalStatusBadge } from "./portal-status-badge";
import { useRedirectWithoutSession } from "./use-portal-session";

const padNumber = (number: number) => String(number).padStart(4, "0");

function EstimateCard({
	estimate,
	onAnswered,
}: {
	estimate: PortalEstimate;
	onAnswered: (serviceOrder: ServiceOrder) => void;
}) {
	const { t, format } = useTranslation();
	const message = useMessage();
	const toastError = useApiErrorToast();
	const [rejecting, setRejecting] = useState(false);
	const number = padNumber(estimate.number);

	const answer = useMutation({
		mutationFn: (
			value: { approve: true } | { approve: false; reason: string }
		) =>
			value.approve
				? portalApi.approveEstimate(estimate.id)
				: portalApi.rejectEstimate(estimate.id, {
						reason: value.reason || undefined,
					}),
		onSuccess: (serviceOrder, value) => {
			setRejecting(false);
			onAnswered(serviceOrder);
			const feedback = message(
				value.approve ? "approve_estimate_success" : "reject_estimate_success",
				"success"
			);
			toast.success({
				text: feedback.title,
				description: feedback.description,
			});
		},
		onError: toastError,
	});

	const canAnswer = estimate.status === "sent" && !estimate.expired;

	return (
		<li className="space-y-3 rounded-lg border p-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<span className="font-medium">
					{t("portal.detail.estimateNumber", { number })}
				</span>
				<div className="flex items-center gap-2">
					{estimate.expired && estimate.status === "sent" ? (
						<span className="text-destructive text-xs">
							{t("portal.detail.expired")}
						</span>
					) : null}
					<EstimateStatusBadge status={estimate.status} />
				</div>
			</div>
			<div className="flex flex-wrap justify-between gap-2 text-muted-foreground text-sm">
				<span>
					{t("portal.detail.validUntil", {
						date: format.date(estimate.validUntil),
					})}
				</span>
				<span className="font-semibold text-foreground tabular-nums">
					{t("portal.detail.total", {
						total: format.currency(estimate.totals.total),
					})}
				</span>
			</div>
			{estimate.rejectionReason ? (
				<p className="text-muted-foreground text-sm italic">
					{estimate.rejectionReason}
				</p>
			) : null}
			<div className="flex flex-col gap-2 md:flex-row md:justify-end">
				<Button asChild size="sm" variant="outline">
					<a
						href={portalApi.estimatePdfUrl(estimate.id)}
						rel="noopener"
						target="_blank"
					>
						<FileText className="size-4" />
						{t("portal.detail.openPdf")}
					</a>
				</Button>
				{canAnswer ? (
					<>
						<Button
							disabled={answer.isPending}
							onClick={() => setRejecting(true)}
							size="sm"
							variant="outline"
						>
							<X className="size-4" />
							{t("portal.detail.reject")}
						</Button>
						<Button
							disabled={answer.isPending}
							onClick={() => answer.mutate({ approve: true })}
							size="sm"
						>
							<Check className="size-4" />
							{t("portal.detail.approve")}
						</Button>
					</>
				) : null}
			</div>
			<RejectDialog
				number={number}
				onConfirm={(reason) => answer.mutate({ approve: false, reason })}
				onOpenChange={setRejecting}
				open={rejecting}
				pending={answer.isPending}
			/>
		</li>
	);
}

/** One service order as the client sees it, with its estimates to answer. */
export function PortalServiceOrder({ id }: { id: string }) {
	const { t, format } = useTranslation();
	const queryClient = useQueryClient();
	const queryKey = ["portal", "service-order", id];
	const {
		data: order,
		isPending,
		error,
	} = useQuery({
		queryKey,
		queryFn: () => portalApi.serviceOrder(id),
		retry: false,
	});
	const redirecting = useRedirectWithoutSession(error);

	if (isPending || redirecting) {
		return <Skeleton className="h-96 w-full max-w-3xl rounded-lg" />;
	}

	const back = (
		<Button asChild className="-translate-x-3" size="sm" variant="ghost">
			<Link href="/portal">
				<ArrowLeft className="size-4" />
				{t("portal.detail.back")}
			</Link>
		</Button>
	);

	if (!order) {
		return (
			<div className="w-full max-w-3xl space-y-4">
				{back}
				<p className="text-muted-foreground">
					{t("messages.codes.service_order_not_found.description")}
				</p>
			</div>
		);
	}

	const onAnswered = (updated: ServiceOrder) => {
		queryClient.setQueryData(queryKey, updated);
		queryClient.invalidateQueries({ queryKey: portalServiceOrdersKey });
	};
	const contact = [
		order.company.phone ? formatPhone(order.company.phone) : null,
		order.company.email,
		order.company.website,
	].filter(Boolean);

	return (
		<article className="w-full max-w-3xl space-y-6">
			{back}
			<header className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="font-heading font-semibold text-2xl md:text-3xl">
						{t("portal.detail.title", {
							device: deviceName(order.deviceMaker, order.deviceModel),
						})}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("portal.list.openedAt", { date: format.date(order.createdAt) })}
					</p>
				</div>
				<PortalStatusBadge status={order.status} />
			</header>

			<section className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
				<div className="space-y-1">
					<h2 className="font-medium text-sm">{t("portal.detail.shop")}</h2>
					<p className="text-sm">{order.company.name}</p>
					{order.company.address ? (
						<p className="text-muted-foreground text-sm">
							{order.company.address}
						</p>
					) : null}
					{contact.length > 0 ? (
						<p className="text-muted-foreground text-sm">
							{contact.join(" · ")}
						</p>
					) : null}
				</div>
				<div className="space-y-1">
					<h2 className="font-medium text-sm">
						{t("portal.detail.reportedDefect")}
					</h2>
					<p className="whitespace-pre-line text-muted-foreground text-sm">
						{order.reportedDefect}
					</p>
				</div>
			</section>

			<section className="space-y-2">
				<h2 className="font-medium">{t("portal.detail.estimates")}</h2>
				{order.estimates.length > 0 ? (
					<ul className="space-y-3">
						{order.estimates.map((estimate) => (
							<EstimateCard
								estimate={estimate}
								key={estimate.id}
								onAnswered={onAnswered}
							/>
						))}
					</ul>
				) : (
					<p className="text-muted-foreground text-sm">
						{t("portal.detail.noEstimates")}
					</p>
				)}
			</section>

			<section className="space-y-2">
				<h2 className="font-medium">{t("portal.detail.items")}</h2>
				{order.items.length > 0 ? (
					<div className="overflow-x-auto rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("estimates.pdf.headers.item")}</TableHead>
									<TableHead className="text-right">
										{t("estimates.pdf.headers.quantity")}
									</TableHead>
									<TableHead className="text-right">
										{t("estimates.pdf.headers.total")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{order.items.map((item, index) => (
									<TableRow key={`${item.name}-${index}`}>
										<TableCell>
											{item.name}
											<span className="block text-muted-foreground text-xs">
												{t(`estimates.pdf.${item.type}`)}
											</span>
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{item.quantity}
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{format.currency(item.total)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				) : (
					<p className="text-muted-foreground text-sm">
						{t("portal.detail.noItems")}
					</p>
				)}
			</section>
		</article>
	);
}
