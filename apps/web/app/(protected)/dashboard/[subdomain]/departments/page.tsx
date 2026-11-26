import { DepartmentsPage } from "@/components/dashboard/departments/departments-page";
import { Heading } from "@/components/dashboard/heading";
import { getTranslator } from "@/lib/i18n/server";

export default async function Page() {
	const { t } = await getTranslator();

	return (
		<div className="space-y-4">
			<Heading
				description={t("departments.page.description")}
				title={t("departments.page.title")}
			/>
			<DepartmentsPage />
		</div>
	);
}
