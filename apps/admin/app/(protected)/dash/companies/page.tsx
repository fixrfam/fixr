import { getTranslator } from "@/lib/i18n/server";

export default async function NewCompanyPage() {
	const { t } = await getTranslator();

	return <span>{t("admin.companies.listPlaceholder")}</span>;
}
