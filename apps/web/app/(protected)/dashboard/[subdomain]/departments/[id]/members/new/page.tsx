"use client";

import { useTranslation } from "@fixr/i18n/react";
import { useParams, useRouter } from "next/navigation";
import { AddMembersForm } from "@/components/dashboard/departments/add-members-form";
import { Heading } from "@/components/dashboard/heading";

export default function AddDepartmentMembersPage() {
	const { t } = useTranslation();
	const router = useRouter();
	const { subdomain, id } = useParams<{ subdomain: string; id: string }>();

	return (
		<div className="max-w-xl space-y-6">
			<Heading
				description={t("departments.members.addDescription")}
				title={t("departments.members.add")}
			/>
			<AddMembersForm
				departmentId={id}
				onSuccess={() =>
					router.replace(`/dashboard/${subdomain}/departments/${id}`)
				}
			/>
		</div>
	);
}
