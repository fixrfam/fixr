"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Camera } from "lucide-react";
import { useCallback } from "react";
import { ImageUploadDialog } from "@/components/image-upload-dialog";
import { useSession } from "@/lib/hooks/use-session";
import { uploadAvatar } from "./utils";

/** Props for the avatar upload dialog. */
interface AvatarUploadDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAvatarChange: (url: string) => void;
}

/** Select, crop (circle) and upload a new profile picture. */
export function AvatarUploadDialog({
	open,
	onOpenChange,
	onAvatarChange,
}: AvatarUploadDialogProps) {
	const { t } = useTranslation();
	const { refreshSession } = useSession();

	const upload = useCallback(
		async (image: Blob, fileName: string) => {
			const url = await uploadAvatar(image, fileName);
			await refreshSession();
			return url;
		},
		[refreshSession]
	);

	return (
		<ImageUploadDialog
			copy={{
				title: t("account.avatar.uploadTitle"),
				stepSelect: t("account.avatar.stepSelect"),
				stepCrop: t("account.avatar.stepCrop"),
				stepUploading: t("account.avatar.stepUploading"),
				saving: t("account.avatar.saving"),
				dropzoneTitle: t("account.avatar.dropzoneTitle"),
				dropzoneHint: t("account.avatar.dropzoneHint"),
				alt: t("account.avatar.alt"),
				success: t("account.avatar.updateSuccess"),
				error: t("account.avatar.updateError"),
			}}
			crop={{ shape: "circle", aspectRatio: 1 }}
			icon={<Camera />}
			onOpenChange={onOpenChange}
			onUploaded={onAvatarChange}
			open={open}
			upload={upload}
		/>
	);
}
