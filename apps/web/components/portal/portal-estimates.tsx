"use client";

import { useMessage, useTranslation } from "@fixr/i18n/react";
import { toast } from "@pheralb/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { CustomerEstimate } from "@/components/estimates/customer-estimate";
import { Skeleton } from "@/components/ui/skeleton";
import { portalApi } from "@/lib/services/portal";
import { PortalEstimateRow, PortalList } from "./portal-cards";
import { PortalBackLink } from "./portal-service-order";
import { PortalPageTitle } from "./portal-shell";
import { portalKeys, usePortalEstimate, usePortalEstimates } from "./store";

/** Every estimate the customer was sent: the ones waiting for an answer first. */
export function PortalEstimates() {
	const { t } = useTranslation();
	const { data, isPending } = usePortalEstimates();
	const estimates = data ?? [];
	const isOpen = (e: (typeof estimates)[number]) =>
		e.status === "sent" && !e.expired;
	const groups = [
		{ title: t("portal.estimates.pending"), list: estimates.filter(isOpen) },
		{
			title: t("portal.estimates.answered"),
			list: estimates.filter((e) => !isOpen(e)),
		},
	].filter((group) => group.list.length > 0);

	return (
		<div>
			<PortalPageTitle
				description={t("portal.estimates.description")}
				title={t("portal.estimates.title")}
			/>
			{isPending && <Skeleton className="h-44 rounded-2xl" />}
			{!isPending && estimates.length === 0 && (
				<p className="py-12 text-center text-muted-foreground text-sm">
					{t("portal.estimates.empty")}
				</p>
			)}
			<div className="space-y-7">
				{groups.map((group) => (
					<section className="space-y-2.5" key={group.title}>
						<h2 className="font-semibold text-sm">{group.title}</h2>
						<PortalList>
							{group.list.map((estimate) => (
								<PortalEstimateRow estimate={estimate} key={estimate.id} />
							))}
						</PortalList>
					</section>
				))}
			</div>
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
