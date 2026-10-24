"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Wrench } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useService } from "@/components/dashboard/parts/store";
import { NewServiceForm } from "@/components/dashboard/services/forms/new-service-form";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditServiceModal() {
	const router = useRouter();
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const { data: service, isPending } = useService(id);

	let body = (
		<p className="text-muted-foreground text-sm">
			{t("services.page.notFound")}
		</p>
	);
	if (isPending) {
		body = <Skeleton className="h-64 w-full" />;
	} else if (service) {
		body = <NewServiceForm onSuccess={() => router.back()} service={service} />;
	}

	return (
		<ResponsiveDialogDrawer
			description={t("services.page.editDescription")}
			icon={<Wrench />}
			title={t("services.page.editTitle")}
		>
			{body}
		</ResponsiveDialogDrawer>
	);
}
