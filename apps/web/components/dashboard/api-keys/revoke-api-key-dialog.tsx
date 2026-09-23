"use client";

import { useMessage, useTranslation } from "@fixr/i18n/react";
import type { ApiResponse } from "@fixr/schemas/utils";
import { toast } from "@pheralb/toast";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError, type AxiosResponse } from "axios";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { axios } from "@/lib/auth/axios";
import { api, tryCatch } from "@/lib/utils";
import type { ApiKeyRow } from "./columns";

/**
 * Confirmation step for revoking a key.
 *
 * Revocation takes effect immediately and cannot be undone, so it is worth an
 * explicit confirmation naming the key.
 */
export function RevokeApiKeyDialog({
	apiKey,
	onOpenChange,
}: {
	apiKey: ApiKeyRow | null;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useTranslation();
	const message = useMessage();
	const [loading, setLoading] = useState(false);
	const { subdomain } = useParams<{ subdomain: string }>();
	const queryClient = useQueryClient();

	async function revoke() {
		if (!apiKey) {
			return;
		}

		setLoading(true);

		try {
			const { data: response, error } = await tryCatch<
				AxiosResponse<ApiResponse>
			>(axios.delete(api(`/companies/${subdomain}/api-keys/${apiKey.id}`)));

			if (error && error instanceof AxiosError) {
				const feedback = message(error.response?.data.code, "error");

				toast.error({
					text: feedback.title,
					description: feedback.description,
				});
				return;
			}

			const feedback = message(response?.data.code, "success");

			toast.success({
				text: feedback.title,
				description: feedback.description,
			});

			queryClient.invalidateQueries({ queryKey: ["apiKeysData"] });
			onOpenChange(false);
		} finally {
			setLoading(false);
		}
	}

	return (
		<AlertDialog onOpenChange={onOpenChange} open={Boolean(apiKey)}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t("apiKeys.revoke.title", { name: apiKey?.name ?? "" })}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t("apiKeys.revoke.description")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading}>
						{t("common.actions.cancel")}
					</AlertDialogCancel>
					<AlertDialogAction
						className="bg-destructive text-white hover:bg-destructive/90"
						disabled={loading}
						onClick={(event) => {
							event.preventDefault();
							revoke();
						}}
					>
						{t("apiKeys.revoke.confirm")}{" "}
						{loading && <Loader2 className="animate-spin" />}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
