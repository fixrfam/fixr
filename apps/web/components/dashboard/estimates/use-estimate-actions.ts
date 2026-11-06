"use client";

import { useMessage } from "@fixr/i18n/react";
import { toast } from "@pheralb/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { type EstimateStatus, estimatesApi } from "@/lib/services/estimates";

export const estimatesKey = (subdomain: string) => ["estimates", subdomain];

/** Open the estimate PDF in a new tab (rendered by the API with the session cookie). */
export function useOpenEstimatePdf() {
	const { subdomain } = useParams<{ subdomain: string }>();
	const toastError = useApiErrorToast();

	return async (estimateId: string) => {
		// Open the tab synchronously so the popup blocker allows it.
		const tab = window.open("", "_blank");
		try {
			const url = await estimatesApi.pdfUrl(subdomain, estimateId);
			if (tab) {
				tab.location.href = url;
			} else {
				window.location.href = url;
			}
		} catch (error) {
			tab?.close();
			toastError(error);
		}
	};
}

/** Status changes, sending and deletion, refreshing the estimates list afterwards. */
export function useEstimateActions() {
	const { subdomain } = useParams<{ subdomain: string }>();
	const queryClient = useQueryClient();
	const message = useMessage();
	const toastError = useApiErrorToast();

	const onSuccess = (code: string) => {
		const feedback = message(code, "success");
		toast.success({ text: feedback.title, description: feedback.description });
		queryClient.invalidateQueries({ queryKey: estimatesKey(subdomain) });
	};

	const updateStatus = useMutation({
		mutationFn: ({ id, status }: { id: string; status: EstimateStatus }) =>
			estimatesApi.updateStatus(subdomain, id, status),
		onSuccess: () => onSuccess("update_estimate_status_success"),
		onError: toastError,
	});

	const send = useMutation({
		mutationFn: ({ id, email }: { id: string; email?: string }) =>
			estimatesApi.send(subdomain, id, { email }),
		onSuccess: () => onSuccess("send_estimate_success"),
		onError: toastError,
	});

	const remove = useMutation({
		mutationFn: (id: string) => estimatesApi.remove(subdomain, id),
		onSuccess: () => onSuccess("delete_estimate_success"),
		onError: toastError,
	});

	return { updateStatus, send, remove };
}
