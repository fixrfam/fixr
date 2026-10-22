"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Package } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { BackButton } from "@/components/dashboard/back-button";
import { Heading } from "@/components/dashboard/heading";
import { NewSupplierForm } from "@/components/dashboard/suppliers/forms/new-supplier-form";

export default function NewSupplierPage() {
	const router = useRouter();
	const { t } = useTranslation();
	const params = useParams<{ subdomain: string }>();

	return (
		<div className="space-y-6">
			<BackButton className="-translate-x-3" />
			<Heading
				description={t("suppliers.page.newDescription")}
				Icon={Package}
				title={t("suppliers.page.newTitle")}
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
