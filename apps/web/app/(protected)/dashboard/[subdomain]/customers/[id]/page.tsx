import { CustomerDetails } from "@/components/dashboard/customers/customer-details";

type Params = Promise<{ id: string }>;

export default async function CustomerPage({ params }: { params: Params }) {
	const { id } = await params;

	return <CustomerDetails id={id} />;
}
