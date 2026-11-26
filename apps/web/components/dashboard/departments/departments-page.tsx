"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Route } from "lucide-react";
import { ServiceOrderDetailsCard } from "@/components/dashboard/service-order/service-order-details-card";
import { DepartmentsTable } from "./departments-table";
import { StageOwners } from "./stage-owners";

/** The departments table and, below it, who receives a service order at each stage. */
export function DepartmentsPage() {
	const { t } = useTranslation();

	return (
		<div className="space-y-4">
			<DepartmentsTable />
			<ServiceOrderDetailsCard
				description={t("departments.stages.description")}
				icon={Route}
				title={t("departments.stages.title")}
			>
				<StageOwners />
			</ServiceOrderDetailsCard>
		</div>
	);
}
