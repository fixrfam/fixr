import { Heading } from "@/components/dashboard/heading";
import { ServiceOrdersTable } from "@/components/dashboard/service-order/service-order-table";

type Params = Promise<{ subdomain: string }>;

export default async function ServiceOrdersPage({
	params,
}: {
	params: Params;
}) {
	const { subdomain } = await params;

	return (
		<div className="space-y-4">
			<Heading
				description={"Controle as ordens de serviço de seus clientes"}
				title={"Ordens de serviço"}
			/>

			<div className="mt-5 rounded-xs">
				<ServiceOrdersTable subdomain={subdomain} />
			</div>
		</div>
	);
}
