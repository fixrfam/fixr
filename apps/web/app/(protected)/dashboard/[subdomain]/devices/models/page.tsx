import { Heading } from "@/components/dashboard/heading";
import { ModelsExplorer } from "@/components/dashboard/models";
import { getTranslator } from "@/lib/i18n/server";

export default async function ModelsPage() {
	const { t } = await getTranslator();

	return (
		<div className="space-y-5">
			<Heading
				description={t("models.page.description")}
				title={t("models.page.title")}
			/>
			<ModelsExplorer />
		</div>
	);
}
