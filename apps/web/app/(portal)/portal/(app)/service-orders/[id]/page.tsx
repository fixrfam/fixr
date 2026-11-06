import { PortalServiceOrder } from "@/components/portal/portal-service-order";

export default async function PortalServiceOrderPage(props: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await props.params;
	return <PortalServiceOrder id={id} />;
}
