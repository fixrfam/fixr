"use client";

import { useTranslation } from "@fixr/i18n/react";
import { parseAsString, useQueryState } from "nuqs";
import { useSectors } from "@/components/dashboard/sectors/store";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const ALL = "all";

/** `?sector=<id>`: one sector's pool inside the list of every order. */
export function useSectorFilter() {
	return useQueryState(
		"sector",
		parseAsString.withOptions({ history: "replace" })
	);
}

export function SectorFilter() {
	const { t } = useTranslation();
	const [sectorId, setSectorId] = useSectorFilter();
	const { data: sectors = [] } = useSectors();

	if (sectors.length === 0) {
		return null;
	}

	return (
		<Select
			onValueChange={(value) => setSectorId(value === ALL ? null : value)}
			value={sectorId ?? ALL}
		>
			<SelectTrigger
				aria-label={t("serviceOrders.table.columns.sector")}
				className="w-auto"
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value={ALL}>
					{t("serviceOrders.pools.allSectors")}
				</SelectItem>
				{sectors.map((sector) => (
					<SelectItem key={sector.id} value={sector.id}>
						{sector.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
