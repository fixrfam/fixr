"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { SectorMembers } from "./sector-members";
import { SectorsList } from "./sectors-list";
import { StageOwners } from "./stage-owners";

function Section({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}

/** Sectors, who is in each one, and who owns each stage of a service order. */
export function SectorsPage() {
	const { t } = useTranslation();
	const ability = useCatalogAbility();
	const canManage = ability.can(permissions.sectors.update);

	return (
		<div className="grid gap-4 lg:grid-cols-2">
			<Section
				description={t("sectors.list.description")}
				title={t("sectors.list.title")}
			>
				<SectorsList />
			</Section>
			{canManage && ability.can(permissions.employees.read) && (
				<Section
					description={t("sectors.members.description")}
					title={t("sectors.members.title")}
				>
					<SectorMembers />
				</Section>
			)}
			<div className="lg:col-span-2">
				<Section
					description={t("sectors.stages.description")}
					title={t("sectors.stages.title")}
				>
					<StageOwners />
				</Section>
			</div>
		</div>
	);
}
