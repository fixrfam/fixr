import { Heading } from "@/components/dashboard/heading";
import { getTranslator } from "@/lib/i18n/server";

export default async function Home() {
	const { t } = await getTranslator();

	return (
		<Heading
			description={t("dashboard.home.description")}
			title={t("dashboard.home.title")}
		/>
	);
}
