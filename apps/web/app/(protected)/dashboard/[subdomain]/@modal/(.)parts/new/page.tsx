"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Puzzle } from "lucide-react";
import { useRouter } from "next/navigation";
import { NewPartForm } from "@/components/dashboard/parts/forms/new-part-form";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function NewPartModal() {
	const router = useRouter();
	const { t } = useTranslation();

	return (
		<ResponsiveDialogDrawer
			description={t("parts.page.newDescription")}
			icon={<Puzzle />}
			title={t("parts.page.newTitle")}
		>
			<NewPartForm onSuccess={() => router.back()} />
		</ResponsiveDialogDrawer>
	);
}
