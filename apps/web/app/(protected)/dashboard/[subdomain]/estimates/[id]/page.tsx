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
import { Reveal } from "@/components/skeleton";
import { CardsShape } from "@/components/skeleton/shapes";
import { Skeleton } from "@/components/ui/skeleton";

export default function EstimateDetailsPage() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const { data: estimate, isPending } = useEstimate(id);

	if (!(isPending || estimate)) {
		return notFound();
	}

	return (
		<div className="space-y-6">
			<BackButton className="-translate-x-3" />
			<Heading
				description={t("estimates.detail.description")}
				title={
					estimate ? (
						t("estimates.detail.title", {
							number: formatEstimateNumber(estimate.number),
						})
					) : (
						<Skeleton className="h-8 w-56" />
					)
				}
			/>
			<Reveal id="estimate-details" loading={isPending}>
				{estimate ? (
					<EstimateDetails estimate={estimate} />
				) : (
					<CardsShape cards={4} />
				)}
			</Reveal>
		</div>
	);
}
