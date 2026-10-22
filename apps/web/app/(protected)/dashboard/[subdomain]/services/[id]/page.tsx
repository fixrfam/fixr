"use client";

import { Wrench } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { BackButton } from "@/components/dashboard/back-button";
import { Heading } from "@/components/dashboard/heading";
import { useServiceRow } from "@/components/dashboard/parts/store";
import { ServiceDetails } from "@/components/dashboard/services/service-details";

export default function ServiceDetailsPage() {
	const { id } = useParams<{ id: string }>();
	const service = useServiceRow(id);

	if (!service) {
		return notFound();
	}

	return (
		<div className="space-y-6">
			<BackButton className="-translate-x-3" />
			<Heading
				description="Detalhes do serviço e instruções de teste."
				Icon={Wrench}
				title={service.name}
			/>
			<ServiceDetails className="max-w-2xl" service={service} />
		</div>
	);
}
