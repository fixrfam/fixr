import { getServiceOrderById } from "@fixr/mock";
import { ArrowLeft, Wrench } from "lucide-react";
import { notFound } from "next/navigation";
import { Heading } from "@/components/dashboard/heading";
import { ServiceOrderDetailsLayout } from "@/components/dashboard/service-order";
import { DashLink } from "@/components/dashboard/service-order/dash-link";
import { Button } from "@/components/ui/button";

type Params = Promise<{ subdomain: string; id: string }>;

export default async function ServiceOrderDetailsPage({
	params,
}: {
	params: Params;
}) {
	const { subdomain, id } = await params;

	const order = await getServiceOrderById(id);

	if (!order) {
		notFound();
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3">
				<Button
					asChild
					className="w-fit -translate-x-2.5"
					size="sm"
					variant="ghost"
				>
					<DashLink href="/service-orders" subdomain={subdomain}>
						<ArrowLeft className="size-4" />
						Voltar
					</DashLink>
				</Button>

				<Heading
					description={"Veja os detalhes completos da ordem de serviço abaixo"}
					title={
						<>
							<Wrench className="mr-2.5 inline-block size-6.5 -translate-y-1 fill-primary text-primary" />
							Ordem de serviço{" "}
							<span className="font-(family-name:--font-inter) font-medium">
								#{order.orderNumber}
							</span>
						</>
					}
				/>
			</div>

			<ServiceOrderDetailsLayout order={order} subdomain={subdomain} />
		</div>
	);
}
