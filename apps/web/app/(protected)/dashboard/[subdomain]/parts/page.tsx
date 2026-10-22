import { Heading } from "@/components/dashboard/heading";
import { PartsTable } from "@/components/dashboard/parts";
import { getTranslator } from "@/lib/i18n/server";

export default async function PartsPage() {
	const { t } = await getTranslator();

	return (
		<div className="space-y-4">
			<Heading
				description={t("parts.page.description")}
				title={t("parts.page.title")}
			/>

			<div className="mt-5 rounded-xs">
				<PartsTable />
			</div>
		</div>
	);
}
