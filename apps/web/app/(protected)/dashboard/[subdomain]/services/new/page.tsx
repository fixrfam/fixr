"use client";

import { Wrench } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { BackButton } from "@/components/dashboard/back-button";
import { Heading } from "@/components/dashboard/heading";
import { NewServiceForm } from "@/components/dashboard/services/forms/new-service-form";

export default function NewServicePage() {
	const router = useRouter();
	const params = useParams<{ subdomain: string }>();

	return (
		<div className="space-y-6">
			<BackButton className="-translate-x-3" />
			<Heading
				description="Preencha os campos abaixo para cadastrar um novo serviço."
				Icon={Wrench}
				title="Cadastrar serviço"
			/>
			<div>
				<NewServiceForm
					className="max-w-2xl"
					onSuccess={() =>
						router.push(`/dashboard/${params.subdomain}/services`)
					}
				/>
			</div>
		</div>
	);
}
