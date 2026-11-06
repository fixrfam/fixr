"use client";

import { useMessage, useTranslation } from "@fixr/i18n/react";
import { toast } from "@pheralb/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { Skeleton } from "@/components/ui/skeleton";
import { estimateLinksApi } from "@/lib/services/estimates";
import { CustomerEstimate } from "./customer-estimate";

/** The estimate opened from the emailed link, with the approve and reject actions. */
export function PublicEstimate({ token }: { token: string }) {
	const { t } = useTranslation();
	const message = useMessage();
	const toastError = useApiErrorToast();
	const queryClient = useQueryClient();
	const queryKey = ["estimate-link", token];

	const {
		data: estimate,
		isPending,
		isError,
	} = useQuery({
		queryKey,
		queryFn: () => estimateLinksApi.get(token),
		retry: false,
	});

	const answer = useMutation({
		mutationFn: (
			value: { approve: true } | { approve: false; reason: string }
		) =>
			value.approve
				? estimateLinksApi.approve(token)
				: estimateLinksApi.reject(token, { reason: value.reason || undefined }),
		onSuccess: (updated, value) => {
			queryClient.setQueryData(queryKey, updated);
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
			queryClient.invalidateQueries({ queryKey });
		},
	});

	if (isPending) {
		return (
			<div className="w-full space-y-4">
				<Skeleton className="h-48 w-full rounded-2xl" />
				<Skeleton className="h-64 w-full rounded-2xl" />
			</div>
		);
	}

	if (isError || !estimate) {
		return (
			<section className="mx-auto w-full max-w-xl space-y-2 pt-10 text-center">
				<h1 className="font-heading font-semibold text-2xl">
					{t("estimates.public.invalidTitle")}
				</h1>
				<p className="text-muted-foreground">
					{t("estimates.public.invalidDescription")}
				</p>
			</section>
		);
	}

	return (
		<CustomerEstimate
			estimate={estimate}
			onApprove={() => answer.mutate({ approve: true })}
			onReject={(reason) => answer.mutate({ approve: false, reason })}
			pdfUrl={estimateLinksApi.pdfUrl(token)}
			pending={answer.isPending}
		/>
	);
}
