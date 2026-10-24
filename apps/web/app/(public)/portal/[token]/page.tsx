import { PortalEntry } from "@/components/portal/portal-entry";

/** The link from the portal email: opens the session, then shows the portal. */
export default async function PortalLinkPage(props: {
	params: Promise<{ token: string }>;
}) {
	const { token } = await props.params;
	return <PortalEntry token={token} />;
}
