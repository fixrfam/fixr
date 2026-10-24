import { PublicEstimate } from "@/components/estimates/public-estimate";
import QueryClientWrapper from "@/lib/query-client";

/** Page the customer opens from the estimate email to approve or reject it. */
export default async function EstimateLinkPage(props: {
	params: Promise<{ token: string }>;
}) {
	const { token } = await props.params;

	return (
		<main className="flex min-h-screen flex-col items-center px-4 py-20 md:px-6">
			<QueryClientWrapper>
				<PublicEstimate token={token} />
			</QueryClientWrapper>
		</main>
	);
}
