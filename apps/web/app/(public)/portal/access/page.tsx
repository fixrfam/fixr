import { PortalAccessForm } from "@/components/portal/portal-access-form";
import QueryClientWrapper from "@/lib/query-client";

export default function PortalAccessPage() {
	return (
		<QueryClientWrapper>
			<PortalAccessForm />
		</QueryClientWrapper>
	);
}
