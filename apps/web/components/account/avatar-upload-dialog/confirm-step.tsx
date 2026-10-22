"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Loader2 } from "lucide-react";

/**
 * Loading state shown while the avatar is being uploaded to R2
 * and the server updates the user profile.
 */
export function ConfirmStep() {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col items-center justify-center gap-4 py-12">
			<Loader2 className="size-10 animate-spin text-primary" />
			<p className="text-muted-foreground text-sm">
				{t("account.avatar.saving")}
			</p>
		</div>
	);
}
