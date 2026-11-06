import { PublicEstimate } from "@/components/estimates/public-estimate";
import QueryClientWrapper from "@/lib/query-client";

/** Page the client opens from the estimate email to approve or reject it. */
export default async function EstimateLinkPage(props: {
	params: Promise<{ token: string }>;
}) {
	const { token } = await props.params;

	return (
		<main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pt-20 pb-10 md:px-6">
			<QueryClientWrapper>
				<PublicEstimate token={token} />
			</QueryClientWrapper>
		</main>
	);
}
