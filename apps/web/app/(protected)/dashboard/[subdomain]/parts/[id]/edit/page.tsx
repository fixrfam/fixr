"use client";

import { Puzzle } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { BackButton } from "@/components/dashboard/back-button";
import { Heading } from "@/components/dashboard/heading";
import { NewPartForm } from "@/components/dashboard/parts/forms/new-part-form";
import { usePartsStore } from "@/components/dashboard/parts/store";

export default function EditPartPage() {
	const router = useRouter();
	const params = useParams<{ subdomain: string; id: string }>();
	const part = usePartsStore((state) =>
		state.parts.find((item) => item.id === params.id)
	);

	if (!part) {
		return notFound();
	}

	return (
		<div className="space-y-6">
			<BackButton className="-translate-x-3" />
			<Heading
				description="Altere os campos abaixo e salve as modificações."
				Icon={Puzzle}
				title="Editar peça"
			/>
			<div>
				<NewPartForm
					className="max-w-2xl"
					onSuccess={() => router.push(`/dashboard/${params.subdomain}/parts`)}
					part={part}
				/>
			</div>
		</div>
	);
}
