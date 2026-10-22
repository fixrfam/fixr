"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { NewServiceForm } from "@/components/dashboard/services/forms/new-service-form";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function NewServiceModal() {
	const router = useRouter();
	const { t } = useTranslation();

	return (
		<ResponsiveDialogDrawer
			description={t("services.page.newDescription")}
			icon={<Wrench />}
			title={t("services.page.newTitle")}
		>
			<NewServiceForm onSuccess={() => router.back()} />
		</ResponsiveDialogDrawer>
	);
}
