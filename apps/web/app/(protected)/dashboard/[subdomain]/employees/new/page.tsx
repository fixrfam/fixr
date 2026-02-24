"use client";

import { UserRoundPlus } from "lucide-react";
import { redirect, useParams, useRouter } from "next/navigation";
import { BackButton } from "@/components/dashboard/back-button";
import { CreateEmployeeForm } from "@/components/dashboard/employees/new/create-employee-form";
import { Heading } from "@/components/dashboard/heading";
import { useSession } from "@/lib/hooks/use-session";

export default function NewEmployeePage() {
	const session = useSession();

	const router = useRouter();
	const params = useParams<{ subdomain: string }>();

	if (!session) {
		return redirect("/auth/login");
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="space-y-2">
				<BackButton variant={"link"} />
				<Heading
					description={"Adicione um ou mais os funcionários na sua empresa."}
					Icon={UserRoundPlus}
					title={"Cadastrar funcionários"}
				/>
			</div>
			<CreateEmployeeForm
				onSuccess={() =>
					router.push(`/dashboard/${params.subdomain}/employees`)
				}
				session={session}
			/>
		</div>
	);
}
