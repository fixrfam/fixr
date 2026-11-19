"use client";

import { useTranslation } from "@fixr/i18n/react";
import { UserPlus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { AddMembersForm } from "@/components/dashboard/departments/add-members-form";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function AddDepartmentMembersModal() {
	const router = useRouter();
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();

	return (
		<ResponsiveDialogDrawer
			className="max-w-lg!"
			description={t("departments.members.addDescription")}
			icon={<UserPlus />}
			title={t("departments.members.add")}
		>
			<AddMembersForm departmentId={id} onSuccess={() => router.back()} />
		</ResponsiveDialogDrawer>
	);
}
