"use client";

import { useTranslation } from "@fixr/i18n/react";
import { ShieldCheck } from "lucide-react";
import { Heading } from "@/components/dashboard/heading";
import { PermissionsMatrix } from "@/components/dashboard/roles/permissions-matrix";
import { useSession } from "@/lib/hooks/use-session";

export default function RolesPage() {
	const { t } = useTranslation();
	const { session } = useSession();

	return (
		<div className="flex flex-col gap-6">
			<Heading
				description={t("permissions.matrix.description")}
				Icon={ShieldCheck}
				title={t("permissions.matrix.title")}
			/>
			<PermissionsMatrix currentRole={session?.company?.role} />
		</div>
	);
}
