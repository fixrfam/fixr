"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Wrench } from "lucide-react";
import { useParams } from "next/navigation";
import { useServiceRow } from "@/components/dashboard/parts/store";
import { ServiceDetails } from "@/components/dashboard/services/service-details";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function ServiceDetailsModal() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const service = useServiceRow(id);

	return (
		<ResponsiveDialogDrawer
			description={t("services.page.detailsDescription")}
			icon={<Wrench />}
			title={service?.name ?? t("services.page.notFoundTitle")}
		>
			{service ? (
				<ServiceDetails service={service} />
			) : (
				<p className="text-muted-foreground text-sm">
					{t("services.page.notFound")}
				</p>
			)}
		</ResponsiveDialogDrawer>
	);
}
