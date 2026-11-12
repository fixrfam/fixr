"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { Plus } from "lucide-react";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashLink } from "../dash-link";

interface TableToolbarProps {
	search: string;
	onSearchChange: (value: string) => void;
	onClear: () => void;
	children?: ReactNode;
}

export function TableToolbar({
	search,
	onSearchChange,
	onClear,
	children,
}: TableToolbarProps) {
	const { t } = useTranslation();
	const params = useParams<{ subdomain: string }>();
	const ability = useCatalogAbility();

	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex w-full items-center gap-3">
				<Input
					className="max-w-sm"
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder={t("serviceOrders.table.search")}
					value={search}
				/>
				<div className="flex items-center gap-2">
					<Button onClick={onClear} variant="ghost">
						{t("common.actions.clear")}
					</Button>
				</div>
			</div>
			<div className="flex items-center justify-start gap-4">
				{children}
				{ability.can(permissions.serviceOrders.create) && (
					<Button asChild className="shrink-0">
						<DashLink
							href={"/service-orders/new"}
							prefetch
							subdomain={params.subdomain}
						>
							{t("serviceOrders.table.newOrder")} <Plus className="size-3.5" />
						</DashLink>
					</Button>
				)}
			</div>
		</div>
	);
}
