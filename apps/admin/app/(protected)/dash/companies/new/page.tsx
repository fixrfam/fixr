import { CreateCompany } from "@/components/dash/forms/create-company";
import { DashHeader } from "@/components/dash/header";
import { getTranslator } from "@/lib/i18n/server";

export default async function NewCompanyPage() {
	const { t } = await getTranslator();

	return (
		<>
			<DashHeader
				description={t("admin.companies.newDescription")}
				title={t("admin.companies.newTitle")}
			/>
			<CreateCompany />
		</>
	);
}
