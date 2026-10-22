"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Wrench } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { usePartsStore } from "@/components/dashboard/parts/store";
import { NewServiceForm } from "@/components/dashboard/services/forms/new-service-form";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function EditServiceModal() {
	const router = useRouter();
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const service = usePartsStore((state) =>
		state.services.find((item) => item.id === id)
	);

	return (
		<ResponsiveDialogDrawer
			description={t("services.page.editDescription")}
			icon={<Wrench />}
			title={t("services.page.editTitle")}
		>
			{service ? (
				<NewServiceForm onSuccess={() => router.back()} service={service} />
			) : (
				<p className="text-muted-foreground text-sm">
					{t("services.page.notFound")}
				</p>
			)}
		</ResponsiveDialogDrawer>
	);
}
