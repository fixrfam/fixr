"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Puzzle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { NewPartForm } from "@/components/dashboard/parts/forms/new-part-form";
import { useInventory } from "@/components/dashboard/parts/store";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditPartModal() {
	const router = useRouter();
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const { parts, isPending } = useInventory();
	const part = parts.find((item) => item.id === id);

	let body = (
		<p className="text-muted-foreground text-sm">{t("parts.page.notFound")}</p>
	);
	if (isPending) {
		body = <Skeleton className="h-64 w-full" />;
	} else if (part) {
		body = <NewPartForm onSuccess={() => router.back()} part={part} />;
	}

	return (
		<ResponsiveDialogDrawer
			description={t("parts.page.editDescription")}
			icon={<Puzzle />}
			title={t("parts.page.editTitle")}
		>
			{body}
		</ResponsiveDialogDrawer>
	);
}
