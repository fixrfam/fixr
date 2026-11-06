"use client";

import { useTranslation } from "@fixr/i18n/react";
import { EstimatesTable } from "@/components/dashboard/estimates/table/estimates-table";
import { Heading } from "@/components/dashboard/heading";

export default function EstimatesPage() {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col gap-6">
			<Heading
				description={t("estimates.page.description")}
				title={t("estimates.page.title")}
			/>
			<EstimatesTable />
		</div>
	);
}
