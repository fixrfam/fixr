import { ModelDetails } from "@/components/dashboard/models";

export default async function ModelPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;

	return <ModelDetails slug={decodeURIComponent(slug)} />;
}
