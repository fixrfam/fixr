import { ClipboardPlus } from "lucide-react";
import { NewServiceOrderForm } from "@/components/dashboard/service-order/new-service-order-form";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function NewServiceOrderModal() {
	return (
		<ResponsiveDialogDrawer
			description="Preencha os campos abaixo para criar uma nova ordem de serviço."
			icon={<ClipboardPlus />}
			title="Criar nova ordem de serviço"
		>
			<NewServiceOrderForm />
		</ResponsiveDialogDrawer>
	);
}
