"use client";

import { Wrench } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { BackButton } from "@/components/dashboard/back-button";
import { Heading } from "@/components/dashboard/heading";
import { NewServiceForm } from "@/components/dashboard/parts/forms/new-service-form";
import { usePartsStore } from "@/components/dashboard/parts/store";

export default function EditServicePage() {
	const router = useRouter();
	const params = useParams<{ subdomain: string; id: string }>();
	const service = usePartsStore((state) =>
		state.services.find((item) => item.id === params.id)
	);

	if (!service) {
		return notFound();
	}

	return (
		<div className="space-y-6">
			<BackButton className="-translate-x-3" />
			<Heading
				description="Altere os campos abaixo e salve as modificações."
				Icon={Wrench}
				title="Editar serviço"
			/>
			<div>
				<NewServiceForm
					className="max-w-2xl"
					onSuccess={() => router.push(`/dashboard/${params.subdomain}/parts`)}
					service={service}
				/>
			</div>
		</div>
	);
}
