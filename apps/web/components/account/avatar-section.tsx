"use client";

import { useTranslation } from "@fixr/i18n/react";
import type { accountSchema } from "@fixr/schemas/account";
import type { employeeRoles } from "@fixr/schemas/roles";
import { BriefcaseBusiness, Building2 } from "lucide-react";
import { useState } from "react";
import type { z } from "zod";
import { Separator } from "@/components/ui/separator";
import { useAvatar } from "@/lib/hooks/use-avatar";
import { roleLabelKeys } from "@/lib/i18n/labels";
import { AvatarUploadDialog } from "./avatar-upload-dialog";
import { Avatar } from "./profile-avatar";
import { RemoveAvatarDialog } from "./remove-avatar-dialog";

/** Props for the AvatarSection composite component. */
interface AvatarSectionProps {
	account: z.infer<typeof accountSchema>;
}

/**
 * Avatar section shown on the Account settings page.
 *
 * Composes the avatar display (with edit/remove overlays),
 * the upload dialog, and the destructive remove-confirmation dialog.
 */
export function AvatarSection({ account }: AvatarSectionProps) {
	const { t } = useTranslation();
	const { avatarUrl, setAvatarUrl, handleRemove, isRemoving } = useAvatar(
		account.avatarUrl
	);
	const [uploadOpen, setUploadOpen] = useState(false);
	const [removeOpen, setRemoveOpen] = useState(false);

	return (
		<>
			<RemoveAvatarDialog
				loading={isRemoving}
				onConfirm={handleRemove}
				onOpenChange={setRemoveOpen}
				open={removeOpen}
			/>
			<div className="w-full space-y-4 lg:max-w-[20rem]">
				<div className="flex items-start gap-4">
					<Avatar
						className="size-32 text-4xl"
						fallbackHash={account.id}
						onDelete={avatarUrl ? () => setRemoveOpen(true) : undefined}
						onEdit={() => setUploadOpen(true)}
						src={avatarUrl}
					/>
				</div>
				<div className="space-y-5">
					<div>
						<h2
							className={`w-full truncate text-3xl tracking-tight ${account.displayName && "font-semibold"}`}
						>
							{account.displayName ?? t("account.profile.noDisplayName")}
						</h2>
						<p className="text-muted-foreground">{account.email}</p>
					</div>
					<Separator className="my-8" />
					<div>
						<p className="mb-4 font-semibold text-muted-foreground text-xs uppercase">
							{t("account.profile.info")}
						</p>
						<div className="flex flex-col gap-2">
							<div className="inline-flex items-center gap-2 tracking-tight">
								<div className="rounded-md bg-primary/30 p-1 text-primary">
									<Building2 className="size-5" />
								</div>
								{account.company?.name}
							</div>
							<div className="inline-flex items-center gap-2 tracking-tight">
								<div className="rounded-md bg-primary/30 p-1 text-primary">
									<BriefcaseBusiness className="size-5" />
								</div>
								{t(
									roleLabelKeys[
										account.company?.role as z.infer<typeof employeeRoles>
									]
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
			<AvatarUploadDialog
				onAvatarChange={setAvatarUrl}
				onOpenChange={setUploadOpen}
				open={uploadOpen}
			/>
		</>
	);
}
