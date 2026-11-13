import { notFound } from "next/navigation";
import { Heading } from "@/components/dashboard/heading";
import { ServiceOrdersView } from "@/components/dashboard/service-order/pool/service-orders-view";
import { getTranslator } from "@/lib/i18n/server";

type Params = Promise<{ subdomain: string; scope: string }>;

/** "My sector" and "assigned to me": the same list and board, narrowed to the caller's pool. */
export default async function ServiceOrdersPoolPage({
	params,
}: {
	params: Params;
}) {
	const { subdomain, scope } = await params;
	if (scope !== "mine" && scope !== "sector") {
		notFound();
	}
	const { t } = await getTranslator();

	return (
		<div className="space-y-4">
			<Heading
				description={t(
					scope === "mine"
						? "serviceOrders.pools.mineDescription"
						: "serviceOrders.pools.sectorDescription"
				)}
				title={t(
					scope === "mine"
						? "serviceOrders.pools.mineTitle"
						: "serviceOrders.pools.sectorTitle"
				)}
			/>

			<div className="mt-5 rounded-xs">
				<ServiceOrdersView scope={scope} subdomain={subdomain} />
			</div>
		</div>
	);
}
