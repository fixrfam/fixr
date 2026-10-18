"use client";

import { Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { NewSupplierForm } from "@/components/dashboard/suppliers/forms/new-supplier-form";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function NewSupplierModal() {
	const router = useRouter();

	return (
		<ResponsiveDialogDrawer
			description="Preencha os campos abaixo para cadastrar um novo fornecedor."
			icon={<Package />}
			title="Cadastrar fornecedor"
		>
			<NewSupplierForm onSuccess={() => router.back()} />
		</ResponsiveDialogDrawer>
	);
}
