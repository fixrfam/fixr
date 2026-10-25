import { Heading } from "@/components/dashboard/heading";
import { ServicesTable } from "@/components/dashboard/services";
import { getTranslator } from "@/lib/i18n/server";

export default async function ServicesPage() {
	const { t } = await getTranslator();

	return (
		<div className="space-y-4">
			<Heading
				description={t("services.page.description")}
				title={t("services.page.title")}
			/>

			<div className="mt-5 rounded-xs">
				<ServicesTable />
			</div>
		</div>
	);
}
