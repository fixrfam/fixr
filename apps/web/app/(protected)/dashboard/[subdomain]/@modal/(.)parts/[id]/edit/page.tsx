"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Puzzle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { NewPartForm } from "@/components/dashboard/parts/forms/new-part-form";
import { usePart } from "@/components/dashboard/parts/store";
import { Reveal } from "@/components/skeleton";
import { FormShape } from "@/components/skeleton/shapes";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function EditPartModal() {
	const router = useRouter();
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const { data: part, isPending } = usePart(id);

	let body = (
		<p className="text-muted-foreground text-sm">{t("parts.page.notFound")}</p>
	);
	if (isPending || part) {
		body = (
			<Reveal id="part-form" loading={isPending}>
				{part ? (
					<NewPartForm onSuccess={() => router.back()} part={part} />
				) : (
					<FormShape fields={6} />
				)}
			</Reveal>
		);
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
