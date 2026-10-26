import { redirect } from "next/navigation";

/** Devices has two sections; the catalog of models opens first. */
export default async function DevicesPage({
	params,
}: {
	params: Promise<{ subdomain: string }>;
}) {
	const { subdomain } = await params;
	redirect(`/dashboard/${subdomain}/devices/models`);
}
