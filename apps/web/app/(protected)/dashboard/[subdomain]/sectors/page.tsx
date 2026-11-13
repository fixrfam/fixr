import { Heading } from "@/components/dashboard/heading";
import { SectorsPage } from "@/components/dashboard/sectors/sectors-page";
import { getTranslator } from "@/lib/i18n/server";

export default async function Page() {
	const { t } = await getTranslator();

	return (
		<div className="space-y-4">
			<Heading
				description={t("sectors.page.description")}
				title={t("sectors.page.title")}
			/>
			<SectorsPage />
		</div>
	);
}
