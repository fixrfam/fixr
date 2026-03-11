import { Plus } from "lucide-react";
import { DashLink } from "@/components/dashboard/dash-link";
import { Heading } from "@/components/dashboard/heading";
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
			<Button asChild>
				<DashLink href={"/service-orders/new"} prefetch subdomain={subdomain}>
					Nova ordem de serviço <Plus className="size-4" />
				</DashLink>
			</Button>
		</div>
	);
}
