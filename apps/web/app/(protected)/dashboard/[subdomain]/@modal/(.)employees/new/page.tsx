"use client";

import { useTranslation } from "@fixr/i18n/react";
import { UserRoundPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { NewEmployeeForm } from "@/components/dashboard/employees/new/create-employee-form";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function NewEmployeeModal() {
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<ResponsiveDialogDrawer
			description={t("employees.page.newDescription")}
			icon={<UserRoundPlus />}
			title={t("employees.page.newTitle")}
		>
			<NewEmployeeForm onSuccess={() => router.back()} />
		</ResponsiveDialogDrawer>
	);
}
