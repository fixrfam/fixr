import { EstimateEntry } from "@/components/portal/estimate-entry";

/** The link from the estimate email: signs the customer in to the portal on that estimate. */
export default async function EstimateLinkPage(props: {
	params: Promise<{ token: string }>;
}) {
	const { token } = await props.params;
	return <EstimateEntry token={token} />;
}
