import { Heading } from "@/components/dashboard/heading";
import { ServiceOrdersView } from "@/components/dashboard/service-order/pool/service-orders-view";
import { getTranslator } from "@/lib/i18n/server";

type Params = Promise<{ subdomain: string }>;

export default async function ServiceOrdersPage({
	params,
}: {
	params: Params;
}) {
	const { subdomain } = await params;
	const { t } = await getTranslator();

	return (
		<div className="space-y-4">
			<Heading
				description={t("serviceOrders.page.description")}
				title={t("serviceOrders.page.title")}
			/>

			<div className="mt-5 rounded-xs">
				<ServiceOrdersView subdomain={subdomain} />
			</div>
		</div>
	);
}
