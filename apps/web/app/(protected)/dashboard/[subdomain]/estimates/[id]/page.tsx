"use client";

import { useTranslation } from "@fixr/i18n/react";
import { notFound, useParams } from "next/navigation";
import { BackButton } from "@/components/dashboard/back-button";
import { EstimateDetails } from "@/components/dashboard/estimates/estimate-details";
import {
	formatEstimateNumber,
	useEstimate,
} from "@/components/dashboard/estimates/store";
import { Heading } from "@/components/dashboard/heading";
import { Skeleton } from "@/components/ui/skeleton";

export default function EstimateDetailsPage() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const { data: estimate, isPending } = useEstimate(id);

	if (isPending) {
		return <Skeleton className="h-[32rem] w-full" />;
	}

	if (!estimate) {
		return notFound();
	}

	return (
		<div className="space-y-6">
			<BackButton className="-translate-x-3" />
			<Heading
				description={t("estimates.detail.description")}
				title={t("estimates.detail.title", {
					number: formatEstimateNumber(estimate.number),
				})}
			/>
			<EstimateDetails estimate={estimate} />
		</div>
	);
}
