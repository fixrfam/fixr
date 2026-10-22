"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Puzzle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { NewPartForm } from "@/components/dashboard/parts/forms/new-part-form";
import { usePartsStore } from "@/components/dashboard/parts/store";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function EditPartModal() {
	const router = useRouter();
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const part = usePartsStore((state) =>
		state.parts.find((item) => item.id === id)
	);

	return (
		<ResponsiveDialogDrawer
			description={t("parts.page.editDescription")}
			icon={<Puzzle />}
			title={t("parts.page.editTitle")}
		>
			{part ? (
				<NewPartForm onSuccess={() => router.back()} part={part} />
			) : (
				<p className="text-muted-foreground text-sm">
					{t("parts.page.notFound")}
				</p>
			)}
		</ResponsiveDialogDrawer>
	);
}
