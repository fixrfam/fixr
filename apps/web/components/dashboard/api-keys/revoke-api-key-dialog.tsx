"use client";

import { defaultMessages, messages } from "@fixr/constants/messages";
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
				const message =
					messages[error.response?.data.code] ?? defaultMessages.error;

				toast.error({
					text: message.title,
					description: message.description,
				});
				return;
			}

			const message =
				messages[response?.data.code as string] ?? defaultMessages.success;

			toast.success({
				text: message.title,
				description: message.description,
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
						Revogar &ldquo;{apiKey?.name}&rdquo;?
					</AlertDialogTitle>
					<AlertDialogDescription>
						Qualquer integração que use esta chave passa a receber erro de
						autenticação imediatamente. Esta ação não pode ser desfeita.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						className="bg-destructive text-white hover:bg-destructive/90"
						disabled={loading}
						onClick={(event) => {
							event.preventDefault();
							revoke();
						}}
					>
						Revogar {loading && <Loader2 className="animate-spin" />}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
