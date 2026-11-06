"use client";

import { useTranslation } from "@fixr/i18n/react";
import { useParams } from "next/navigation";
import { EstimateDetails } from "@/components/dashboard/estimates/estimate-details";
import {
	formatEstimateNumber,
	useEstimate,
} from "@/components/dashboard/estimates/store";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";
import { Skeleton } from "@/components/ui/skeleton";

export default function EstimateDetailsModal() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const { data: estimate, isPending } = useEstimate(id);

	let body = (
		<p className="text-muted-foreground text-sm">
			{t("estimates.detail.notFound")}
		</p>
	);
	if (isPending) {
		body = <Skeleton className="h-[32rem] w-full" />;
	} else if (estimate) {
		body = <EstimateDetails estimate={estimate} />;
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
