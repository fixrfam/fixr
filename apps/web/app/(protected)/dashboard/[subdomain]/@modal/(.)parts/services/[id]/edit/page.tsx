"use client";

import { Wrench } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { NewServiceForm } from "@/components/dashboard/parts/forms/new-service-form";
import { usePartsStore } from "@/components/dashboard/parts/store";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function EditServiceModal() {
	const router = useRouter();
	const { id } = useParams<{ id: string }>();
	const service = usePartsStore((state) =>
		state.services.find((item) => item.id === id)
	);

	return (
		<ResponsiveDialogDrawer
			description="Altere os campos abaixo e salve as modificações."
			icon={<Wrench />}
			title="Editar serviço"
		>
			{service ? (
				<NewServiceForm onSuccess={() => router.back()} service={service} />
			) : (
				<p className="text-muted-foreground text-sm">
					Não encontramos este serviço.
				</p>
			)}
		</ResponsiveDialogDrawer>
	);
}
