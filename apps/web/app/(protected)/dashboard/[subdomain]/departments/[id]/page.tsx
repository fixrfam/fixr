import { DepartmentDetails } from "@/components/dashboard/departments/department-details";

type Params = Promise<{ subdomain: string; id: string }>;

export default async function DepartmentPage({ params }: { params: Params }) {
	const { subdomain, id } = await params;

	return <DepartmentDetails id={id} subdomain={subdomain} />;
}
