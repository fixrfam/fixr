"use client";

import { useTranslation } from "@fixr/i18n/react";
import { useParams, useRouter } from "next/navigation";
import { NewDepartmentForm } from "@/components/dashboard/departments/new-department-form";
import { Heading } from "@/components/dashboard/heading";

export default function NewDepartmentPage() {
	const { t } = useTranslation();
	const router = useRouter();
	const { subdomain } = useParams<{ subdomain: string }>();

	return (
		<div className="max-w-xl space-y-6">
			<Heading
				description={t("departments.form.description")}
				title={t("departments.form.title")}
			/>
			<NewDepartmentForm
				onSuccess={(department) =>
					router.replace(`/dashboard/${subdomain}/departments/${department.id}`)
				}
			/>
		</div>
	);
}
