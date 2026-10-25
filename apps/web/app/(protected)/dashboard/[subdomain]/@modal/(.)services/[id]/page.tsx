"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Wrench } from "lucide-react";
import { useParams } from "next/navigation";
import { useServiceRow } from "@/components/dashboard/parts/store";
import { ServiceDetails } from "@/components/dashboard/services/service-details";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServiceDetailsModal() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const { service, isPending } = useServiceRow(id);

	let body = (
		<p className="text-muted-foreground text-sm">
			{t("services.page.notFound")}
		</p>
	);
	if (isPending) {
		body = <Skeleton className="h-64 w-full" />;
	} else if (service) {
		body = <ServiceDetails service={service} />;
	}

	return (
		<ResponsiveDialogDrawer
			description={t("services.page.detailsDescription")}
			icon={<Wrench />}
			title={service?.name ?? t("services.page.notFoundTitle")}
		>
			{body}
		</ResponsiveDialogDrawer>
	);
}
