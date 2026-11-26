"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Wrench } from "lucide-react";
import { useParams } from "next/navigation";
import { useServiceRow } from "@/components/dashboard/parts/store";
import { ServiceDetails } from "@/components/dashboard/services/service-details";
import { Reveal } from "@/components/skeleton";
import { CardsShape } from "@/components/skeleton/shapes";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function ServiceDetailsModal() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const { service, isPending } = useServiceRow(id);

	let body = (
		<p className="text-muted-foreground text-sm">
			{t("services.page.notFound")}
		</p>
	);
	if (isPending || service) {
		body = (
			<Reveal id="service-details" loading={isPending}>
				{service ? (
					<ServiceDetails service={service} />
				) : (
					<CardsShape cards={2} className="lg:grid-cols-1" />
				)}
			</Reveal>
		);
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
