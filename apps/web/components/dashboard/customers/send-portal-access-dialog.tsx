"use client";

import { useMessage, useTranslation } from "@fixr/i18n/react";
import { toast } from "@pheralb/toast";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { sendPortalAccess } from "@/lib/services/portal";

/** Confirm and email the client a link to the client portal. */
export function SendPortalAccessDialog({
	client,
	open,
	onOpenChange,
}: {
	client: { id: string; name: string };
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useTranslation();
	const message = useMessage();
	const toastError = useApiErrorToast();
	const { subdomain } = useParams<{ subdomain: string }>();
	const send = useMutation({
		mutationFn: () => sendPortalAccess(subdomain, client.id),
		onSuccess: () => {
			const feedback = message("send_portal_access_success", "success");
			toast.success({
				text: feedback.title,
				description: feedback.description,
			});
			onOpenChange(false);
		},
		onError: toastError,
	});

	return (
		<AlertDialog onOpenChange={onOpenChange} open={open}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t("portal.shopActions.sendAccessTitle", { name: client.name })}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t("portal.shopActions.sendAccessDescription")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>
						{t("portal.shopActions.cancel")}
					</AlertDialogCancel>
					<Button disabled={send.isPending} onClick={() => send.mutate()}>
						{send.isPending ? (
							<Loader2 className="size-4 animate-spin" />
						) : null}
						{t("portal.shopActions.confirm")}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
