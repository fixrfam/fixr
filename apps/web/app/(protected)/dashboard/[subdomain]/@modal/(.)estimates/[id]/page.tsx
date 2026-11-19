"use client";

import { useTranslation } from "@fixr/i18n/react";
import { useParams } from "next/navigation";
import { EstimateDetails } from "@/components/dashboard/estimates/estimate-details";
import {
	formatEstimateNumber,
	useEstimate,
} from "@/components/dashboard/estimates/store";
import { Reveal } from "@/components/skeleton";
import { CardsShape } from "@/components/skeleton/shapes";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";

export default function EstimateDetailsModal() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const { data: estimate, isPending } = useEstimate(id);

	let body = (
		<p className="text-muted-foreground text-sm">
			{t("estimates.detail.notFound")}
		</p>
	);
	if (isPending || estimate) {
		body = (
			<Reveal id="estimate-details" loading={isPending}>
				{estimate ? (
					<EstimateDetails estimate={estimate} />
				) : (
					<CardsShape cards={4} />
				)}
			</Reveal>
		);
	}

	return (
		<ResponsiveDialogDrawer
			className="max-w-6xl!"
			description={t("estimates.detail.description")}
			title={
				estimate
					? t("estimates.detail.title", {
							number: formatEstimateNumber(estimate.number),
						})
					: t("estimates.detail.notFoundTitle")
			}
		>
			{body}
		</ResponsiveDialogDrawer>
	);
}
