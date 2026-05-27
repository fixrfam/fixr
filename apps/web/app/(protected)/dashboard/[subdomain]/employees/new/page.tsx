"use client";

import { UserRoundPlus } from "lucide-react";
import { redirect, useParams, useRouter } from "next/navigation";
import { BackButton } from "@/components/dashboard/back-button";
import { NewEmployeeForm } from "@/components/dashboard/employees/new/create-employee-form";
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
				<BackButton className="-translate-x-3" variant={"link"} />
				<Heading
					description={"Adicione um ou mais os funcionários na sua empresa."}
					Icon={UserRoundPlus}
					title={"Cadastrar funcionários"}
				/>
			</div>
			<NewEmployeeForm
				onSuccess={() =>
					router.push(`/dashboard/${params.subdomain}/employees`)
				}
			/>
		</div>
	);
}
