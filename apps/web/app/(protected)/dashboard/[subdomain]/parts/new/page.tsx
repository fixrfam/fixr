"use client";

import { Puzzle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { BackButton } from "@/components/dashboard/back-button";
import { Heading } from "@/components/dashboard/heading";
import { NewPartForm } from "@/components/dashboard/parts/forms/new-part-form";

export default function NewPartPage() {
	const router = useRouter();
	const params = useParams<{ subdomain: string }>();

	return (
		<div className="space-y-6">
			<BackButton className="-translate-x-3" />
			<Heading
				description="Preencha os campos abaixo para cadastrar uma nova peça."
				Icon={Puzzle}
				title="Cadastrar peça"
			/>
			<div>
				<NewPartForm
					className="max-w-2xl"
					onSuccess={() => router.push(`/dashboard/${params.subdomain}/parts`)}
				/>
			</div>
		</div>
	);
}
