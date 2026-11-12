import { ServiceOrderDetails } from "@/components/dashboard/service-order/service-order-details";

type Params = Promise<{ subdomain: string; id: string }>;

export default async function ServiceOrderDetailsPage({
	params,
}: {
	params: Params;
}) {
	const { subdomain, id } = await params;

	return <ServiceOrderDetails id={id} subdomain={subdomain} />;
}
