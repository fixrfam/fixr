import { redirect } from "next/navigation";

type Params = Promise<{ subdomain: string }>;

export default async function Dashboard({ params }: { params: Params }) {
    const { subdomain } = await params;
    return redirect(`/dashboard/${subdomain}/home`);
}
