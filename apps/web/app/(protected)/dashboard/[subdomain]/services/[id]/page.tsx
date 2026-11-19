"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Wrench } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { BackButton } from "@/components/dashboard/back-button";
import { Heading } from "@/components/dashboard/heading";
import { useServiceRow } from "@/components/dashboard/parts/store";
import { ServiceDetails } from "@/components/dashboard/services/service-details";
import { Reveal } from "@/components/skeleton";
import { CardsShape } from "@/components/skeleton/shapes";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServiceDetailsPage() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const { service, isPending } = useServiceRow(id);

	if (!(isPending || service)) {
		return notFound();
	}

	return (
		<div className="space-y-6">
			<BackButton className="-translate-x-3" />
			<Heading
				description={t("services.page.detailsDescription")}
				Icon={Wrench}
				title={service?.name ?? <Skeleton className="h-8 w-56" />}
			/>
			<Reveal className="max-w-2xl" id="service-details" loading={isPending}>
				{service ? (
					<ServiceDetails service={service} />
				) : (
					<CardsShape cards={2} className="lg:grid-cols-1" />
				)}
			</Reveal>
		</div>
	);
}
