import { Plus } from "lucide-react";
import { Heading } from "@/components/dashboard/heading";
import { DashLink } from "@/components/dashboard/service-order/dash-link";
import { ServiceOrdersTable } from "@/components/dashboard/service-order/service-order-table";
import { Button } from "@/components/ui/button";

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

			<div className="flex justify-start">
				<Button asChild className="h-9.5 shrink-0">
					<DashLink href={"/service-orders/new"} prefetch subdomain={subdomain}>
						Nova ordem de serviço <Plus className="size-4" />
					</DashLink>
				</Button>
			</div>

			<div className="mt-5 rounded-xs">
				<ServiceOrdersTable subdomain={subdomain} />
			</div>
		</div>
	);
}
