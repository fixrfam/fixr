"use client";

import { Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { NewServiceForm } from "@/components/dashboard/services/forms/new-service-form";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function NewServiceModal() {
	const router = useRouter();

	return (
		<ResponsiveDialogDrawer
			description="Preencha os campos abaixo para cadastrar um novo serviço."
			icon={<Wrench />}
			title="Cadastrar serviço"
		>
			<NewServiceForm onSuccess={() => router.back()} />
		</ResponsiveDialogDrawer>
	);
}
