"use client";

import { Puzzle } from "lucide-react";
import { useRouter } from "next/navigation";
import { NewPartForm } from "@/components/dashboard/parts/forms/new-part-form";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function NewPartModal() {
	const router = useRouter();

	return (
		<ResponsiveDialogDrawer
			description="Preencha os campos abaixo para cadastrar uma nova peça."
			icon={<Puzzle />}
			title="Cadastrar peça"
		>
			<NewPartForm onSuccess={() => router.back()} />
		</ResponsiveDialogDrawer>
	);
}
