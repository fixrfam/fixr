import { Heading } from "@/components/dashboard/heading";
import { SuppliersTable } from "@/components/dashboard/suppliers";
import { getTranslator } from "@/lib/i18n/server";

export default async function SuppliersPage() {
	const { t } = await getTranslator();

	return (
		<div className="space-y-4">
			<Heading
				description={t("suppliers.page.description")}
				title={t("suppliers.page.title")}
			/>

			<div className="mt-5 rounded-xs">
				<SuppliersTable />
			</div>
		</div>
	);
}
