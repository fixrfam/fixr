"use client";

import { useMessage, useTranslation } from "@fixr/i18n/react";
import { toast } from "@pheralb/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { CustomerEstimate } from "@/components/estimates/customer-estimate";
import { Skeleton } from "@/components/ui/skeleton";
import { portalApi } from "@/lib/services/portal";
import { PortalEstimateCard } from "./portal-cards";
import { PortalBackLink } from "./portal-service-order";
import { PortalPageTitle } from "./portal-shell";
import { portalKeys, usePortalEstimate, usePortalEstimates } from "./store";

/** Every estimate the customer was sent: the ones waiting for an answer first. */
export function PortalEstimates() {
	const { t } = useTranslation();
	const { data, isPending } = usePortalEstimates();
	const estimates = data ?? [];
	const open = estimates.filter((e) => e.status === "sent" && !e.expired);
	const others = estimates.filter((e) => !(e.status === "sent" && !e.expired));

	return (
		<div>
			<PortalPageTitle
				description={t("portal.estimates.description")}
				title={t("portal.estimates.title")}
			/>
			{isPending && (
				<div className="grid gap-3">
					<Skeleton className="h-36 rounded-2xl" />
					<Skeleton className="h-36 rounded-2xl" />
				</div>
			)}
			{!isPending && estimates.length === 0 && (
				<p className="rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground text-sm">
					{t("portal.estimates.empty")}
				</p>
			)}
			{open.length > 0 && (
				<section className="mb-7 space-y-3">
					<h2 className="font-semibold text-sm">
						{t("portal.estimates.pending")}
					</h2>
					<div className="grid gap-3 sm:grid-cols-2">
						{open.map((estimate) => (
							<PortalEstimateCard
								estimate={estimate}
								highlight
								key={estimate.id}
							/>
						))}
					</div>
				</section>
			)}
			{others.length > 0 && (
				<section className="space-y-3">
					<h2 className="font-semibold text-sm">
						{t("portal.estimates.answered")}
					</h2>
					<div className="grid gap-3 sm:grid-cols-2">
						{others.map((estimate) => (
							<PortalEstimateCard estimate={estimate} key={estimate.id} />
						))}
					</div>
				</section>
			)}
		</div>
	);
}

/** One estimate in the portal: the PDF, the order, the device and the answer. */
export function PortalEstimate({ id }: { id: string }) {
	const { t } = useTranslation();
	const message = useMessage();
	const toastError = useApiErrorToast();
	const queryClient = useQueryClient();
	const { data: estimate, isPending } = usePortalEstimate(id);

	const answer = useMutation({
		mutationFn: (
			value: { approve: true } | { approve: false; reason: string }
		) =>
			value.approve
				? portalApi.approveEstimate(id)
				: portalApi.rejectEstimate(id, { reason: value.reason || undefined }),
		onSuccess: (updated, value) => {
			queryClient.setQueryData(portalKeys.estimate(id), updated);
			// The lists only: the estimate itself is the answer just received.
			queryClient.invalidateQueries({
				queryKey: portalKeys.estimates,
				exact: true,
			});
			queryClient.invalidateQueries({ queryKey: portalKeys.serviceOrders });
			const feedback = message(
				value.approve ? "approve_estimate_success" : "reject_estimate_success",
				"success"
			);
			toast.success({
				text: feedback.title,
				description: feedback.description,
			});
		},
		onError: (error) => {
			toastError(error);
			queryClient.invalidateQueries({ queryKey: portalKeys.estimate(id) });
		},
	});

	if (isPending) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-48 rounded-2xl" />
				<Skeleton className="h-64 rounded-2xl" />
			</div>
		);
	}

	if (!estimate) {
		return (
			<div>
				<PortalBackLink
					href="/portal/estimates"
					label={t("portal.estimates.back")}
				/>
				<p className="rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground text-sm">
					{t("portal.estimates.notFound")}
				</p>
			</div>
		);
	}

	return (
		<CustomerEstimate
			estimate={estimate}
			header={
				<PortalBackLink
					href="/portal/estimates"
					label={t("portal.estimates.back")}
				/>
			}
			onApprove={() => answer.mutate({ approve: true })}
			onReject={(reason) => answer.mutate({ approve: false, reason })}
			pdfUrl={portalApi.estimatePdfUrl(id)}
			pending={answer.isPending}
			withBottomNav
		/>
	);
}
