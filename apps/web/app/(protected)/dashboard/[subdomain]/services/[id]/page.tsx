"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Wrench } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { BackButton } from "@/components/dashboard/back-button";
import { Heading } from "@/components/dashboard/heading";
import {
	useInventory,
	useServiceRow,
} from "@/components/dashboard/parts/store";
import { ServiceDetails } from "@/components/dashboard/services/service-details";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServiceDetailsPage() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const service = useServiceRow(id);
	const { isPending } = useInventory();

	if (isPending) {
		return <Skeleton className="h-96 w-full max-w-2xl" />;
	}

	if (!service) {
		return notFound();
	}

	return (
		<div className="space-y-6">
			<BackButton className="-translate-x-3" />
			<Heading
				description={t("services.page.detailsDescription")}
				Icon={Wrench}
				title={service.name}
			/>
			<ServiceDetails className="max-w-2xl" service={service} />
		</div>
	);
}
