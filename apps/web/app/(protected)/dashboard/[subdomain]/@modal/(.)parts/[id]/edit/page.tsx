"use client";

import { Puzzle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { NewPartForm } from "@/components/dashboard/parts/forms/new-part-form";
import { usePartsStore } from "@/components/dashboard/parts/store";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function EditPartModal() {
	const router = useRouter();
	const { id } = useParams<{ id: string }>();
	const part = usePartsStore((state) =>
		state.parts.find((item) => item.id === id)
	);

	return (
		<ResponsiveDialogDrawer
			description="Altere os campos abaixo e salve as modificações."
			icon={<Puzzle />}
			title="Editar peça"
		>
			{part ? (
				<NewPartForm onSuccess={() => router.back()} part={part} />
			) : (
				<p className="text-muted-foreground text-sm">
					Não encontramos esta peça.
				</p>
			)}
		</ResponsiveDialogDrawer>
	);
}
