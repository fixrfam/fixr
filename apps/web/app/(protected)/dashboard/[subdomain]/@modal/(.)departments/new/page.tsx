"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Network } from "lucide-react";
import { useRouter } from "next/navigation";
import { NewDepartmentForm } from "@/components/dashboard/departments/new-department-form";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function NewDepartmentModal() {
	const router = useRouter();
	const { t } = useTranslation();

	return (
		<ResponsiveDialogDrawer
			description={t("departments.form.description")}
			icon={<Network />}
			title={t("departments.form.title")}
		>
			<NewDepartmentForm onSuccess={() => router.back()} />
		</ResponsiveDialogDrawer>
	);
}
