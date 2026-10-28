import { DevicesTable } from "@/components/dashboard/devices/devices-table";
import { Heading } from "@/components/dashboard/heading";
import { getTranslator } from "@/lib/i18n/server";

export default async function CustomerDevicesPage() {
	const { t } = await getTranslator();

	return (
		<div className="space-y-5">
			<Heading
				description={t("devices.page.description")}
				title={t("devices.page.title")}
			/>
			<DevicesTable />
		</div>
	);
}
