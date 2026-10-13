"use client";

import { Package } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { BackButton } from "@/components/dashboard/back-button";
import { Heading } from "@/components/dashboard/heading";
import { NewSupplierForm } from "@/components/dashboard/parts/forms/new-supplier-form";

export default function NewSupplierPage() {
	const router = useRouter();
	const params = useParams<{ subdomain: string }>();

	return (
		<div className="space-y-6">
			<BackButton className="-translate-x-3" />
			<Heading
				description="Preencha os campos abaixo para cadastrar um novo fornecedor."
				Icon={Package}
				title="Cadastrar fornecedor"
			/>
			<div>
				<NewSupplierForm
					className="max-w-2xl"
					onSuccess={() =>
						router.push(`/dashboard/${params.subdomain}/suppliers`)
					}
				/>
			</div>
		</div>
	);
}
