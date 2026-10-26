"use client";

import { useTranslation } from "@fixr/i18n/react";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { CustomerForm } from "@/components/dashboard/customers/customer-form";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function NewCustomerModal() {
	const router = useRouter();
	const { t } = useTranslation();

	return (
		<ResponsiveDialogDrawer
			description={t("clients.page.newDescription")}
			icon={<UserPlus />}
			title={t("clients.page.newTitle")}
		>
			<CustomerForm cols={2} onSaved={() => router.back()} />
		</ResponsiveDialogDrawer>
	);
}
