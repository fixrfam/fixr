"use client";

import { Wrench } from "lucide-react";
import { useParams } from "next/navigation";
import { useServiceRow } from "@/components/dashboard/parts/store";
import { ServiceDetails } from "@/components/dashboard/services/service-details";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function ServiceDetailsModal() {
	const { id } = useParams<{ id: string }>();
	const service = useServiceRow(id);

	return (
		<ResponsiveDialogDrawer
			description="Detalhes do serviço e instruções de teste."
			icon={<Wrench />}
			title={service?.name ?? "Serviço não encontrado"}
		>
			{service ? (
				<ServiceDetails service={service} />
			) : (
				<p className="text-muted-foreground text-sm">
					Não encontramos este serviço.
				</p>
			)}
		</ResponsiveDialogDrawer>
	);
}
