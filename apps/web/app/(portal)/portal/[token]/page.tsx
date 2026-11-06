import { PortalEntry } from "@/components/portal/portal-entry";

/** The magic link from the portal email: signs the browser in, then opens the portal. */
export default async function PortalLinkPage(props: {
	params: Promise<{ token: string }>;
}) {
	const { token } = await props.params;
	return <PortalEntry token={token} />;
}
