"use client";

import { useTranslation } from "@fixr/i18n/react";
import { toast } from "@pheralb/toast";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
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
import { useDeleteDevice } from "./store";

export function DeleteDeviceDialog({
	deviceId,
	onOpenChange,
}: {
	/** The device to delete; the dialog is open while it is set. */
	deviceId: string | null;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useTranslation();
	const deleteDevice = useDeleteDevice();
	const toastError = useApiErrorToast();

	async function confirm() {
		if (!deviceId) {
			return;
		}
		try {
			await deleteDevice.mutateAsync(deviceId);
			toast.success({ text: t("devices.delete.deleted") });
			onOpenChange(false);
		} catch (error) {
			toastError(error);
		}
	}

	return (
		<AlertDialog onOpenChange={onOpenChange} open={Boolean(deviceId)}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("devices.delete.title")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("devices.delete.description")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("devices.delete.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						disabled={deleteDevice.isPending}
						onClick={(event) => {
							event.preventDefault();
							confirm();
						}}
					>
						{t("devices.delete.confirm")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
