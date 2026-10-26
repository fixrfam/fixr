"use client";

import { useTranslation } from "@fixr/i18n/react";
import { ClipboardPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { NewServiceOrderForm } from "@/components/dashboard/service-order/new-service-order-form";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function NewServiceOrderModal() {
	const router = useRouter();
	const { t } = useTranslation();

	return (
		<ResponsiveDialogDrawer
			description={t("serviceOrders.page.newDescription")}
			icon={<ClipboardPlus />}
			title={t("serviceOrders.page.newTitle")}
		>
			<NewServiceOrderForm onCreated={() => router.back()} />
		</ResponsiveDialogDrawer>
	);
}
