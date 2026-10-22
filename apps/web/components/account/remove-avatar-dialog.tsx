"use client";

import { useTranslation } from "@fixr/i18n/react";
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

/** Props for the remove-avatar confirmation dialog. */
interface RemoveAvatarDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Called when the user confirms removal. */
	onConfirm: () => void;
	/** Whether the removal request is in flight. */
	loading?: boolean;
}

/**
 * Destructive confirmation dialog for removing the user's profile picture.
 *
 * Renders a red remove action button next to a cancel button.
 */
export function RemoveAvatarDialog({
	open,
	onOpenChange,
	onConfirm,
	loading = false,
}: RemoveAvatarDialogProps) {
	const { t } = useTranslation();

	return (
		<AlertDialog onOpenChange={onOpenChange} open={open}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("account.avatar.removeTitle")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("account.avatar.removeDescription")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading}>
						{t("common.actions.cancel")}
					</AlertDialogCancel>
					<AlertDialogAction
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						disabled={loading}
						onClick={onConfirm}
					>
						{loading
							? t("account.avatar.removing")
							: t("common.actions.remove")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
