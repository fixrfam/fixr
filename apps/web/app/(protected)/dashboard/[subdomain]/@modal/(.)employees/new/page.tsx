"use client";

import { UserRoundPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { NewEmployeeForm } from "@/components/dashboard/employees/new/create-employee-form";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function NewEmployeeModal() {
	const router = useRouter();

	return (
		<ResponsiveDialogDrawer
			description="Adicione um ou mais os funcionários na sua empresa."
			icon={<UserRoundPlus />}
			title="Cadastrar funcionários"
		>
			<NewEmployeeForm onSuccess={() => router.back()} />
		</ResponsiveDialogDrawer>
	);
}
