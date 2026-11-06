import { CustomersTable } from "@/components/dashboard/customers/customers-table";
import { Heading } from "@/components/dashboard/heading";
import { getTranslator } from "@/lib/i18n/server";

export default async function CustomersPage() {
	const { t } = await getTranslator();

	return (
		<div className="space-y-4">
			<Heading
				description={t("customers.page.description")}
				title={t("customers.page.title")}
			/>
			<div className="mt-5 rounded-xs">
				<CustomersTable />
			</div>
		</div>
	);
}
