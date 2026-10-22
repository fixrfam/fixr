"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { NewSupplierForm } from "@/components/dashboard/suppliers/forms/new-supplier-form";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function NewSupplierModal() {
	const router = useRouter();
	const { t } = useTranslation();

	return (
		<ResponsiveDialogDrawer
			description={t("suppliers.page.newDescription")}
			icon={<Package />}
			title={t("suppliers.page.newTitle")}
		>
			<NewSupplierForm onSuccess={() => router.back()} />
		</ResponsiveDialogDrawer>
	);
}
