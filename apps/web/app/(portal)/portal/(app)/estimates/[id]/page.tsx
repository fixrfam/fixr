import { PortalEstimate } from "@/components/portal/portal-estimates";

export default async function PortalEstimatePage(props: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await props.params;
	return <PortalEstimate id={id} />;
}
