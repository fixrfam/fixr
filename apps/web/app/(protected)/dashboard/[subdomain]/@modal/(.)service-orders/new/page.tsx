import { ClipboardPlus } from "lucide-react";
import { NewServiceOrderForm } from "@/components/dashboard/service-order/new-service-order-form";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";
import { getTranslator } from "@/lib/i18n/server";

export default async function NewServiceOrderModal() {
	const { t } = await getTranslator();

	return (
		<ResponsiveDialogDrawer
			description={t("serviceOrders.page.newDescription")}
			icon={<ClipboardPlus />}
			title={t("serviceOrders.page.newTitle")}
		>
			<NewServiceOrderForm />
		</ResponsiveDialogDrawer>
	);
}
