import { ClipboardPlus } from "lucide-react";
import { BackButton } from "@/components/dashboard/back-button";
import { Heading } from "@/components/dashboard/heading";
import { NewServiceOrderForm } from "@/components/dashboard/service-order/new-service-order-form";
import { getTranslator } from "@/lib/i18n/server";

export default async function NewServiceOrderPage() {
	const { t } = await getTranslator();

	return (
		<div className="space-y-6">
			<BackButton className="-translate-x-3" />
			<Heading
				description={t("serviceOrders.page.newDescription")}
				Icon={ClipboardPlus}
				title={t("serviceOrders.page.newTitle")}
			/>
			<div>
				<NewServiceOrderForm className="max-w-2xl" />
			</div>
		</div>
	);
}
