import { redirect } from "next/navigation";

/** Devices has sub sections; models is the one that exists today. */
export default async function DevicesPage({
	params,
}: {
	params: Promise<{ subdomain: string }>;
}) {
	const { subdomain } = await params;
	redirect(`/dashboard/${subdomain}/devices/models`);
}
