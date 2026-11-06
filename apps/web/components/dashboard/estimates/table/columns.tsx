"use client";

import { useTranslation } from "@fixr/i18n/react";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import type { Estimate } from "@/lib/services/estimates";
import { EstimateActionsMenu } from "../estimate-actions";
import { EstimateStatusBadge } from "../estimate-status-badge";
import {
	EstimateClientCell,
	EstimateItemsCell,
	EstimateNumberCell,
	EstimateOrderCell,
	EstimateTotalCell,
	EstimateValidityCell,
} from "./cells";

const columnHelper = createColumnHelper<Estimate>();

export function useEstimateColumns(subdomain: string): ColumnDef<Estimate>[] {
	const { t } = useTranslation();

	return useMemo(
		() => [
			columnHelper.display({
				id: "number",
				header: t("estimates.table.headers.number"),
				cell: ({ row }) => <EstimateNumberCell estimate={row.original} />,
				meta: { label: t("estimates.table.headers.number") },
			}),
			columnHelper.display({
				id: "client",
				header: t("estimates.table.headers.client"),
				cell: ({ row }) => (
					<EstimateClientCell
						client={row.original.client}
						subdomain={subdomain}
					/>
				),
				meta: { label: t("estimates.table.headers.client") },
			}),
			columnHelper.display({
				id: "serviceOrder",
				header: t("estimates.table.headers.serviceOrder"),
				cell: ({ row }) => (
					<EstimateOrderCell estimate={row.original} subdomain={subdomain} />
				),
				meta: { label: t("estimates.table.headers.serviceOrder") },
			}),
			columnHelper.display({
				id: "items",
				header: t("estimates.table.headers.items"),
				cell: ({ row }) => (
					<EstimateItemsCell count={row.original.itemsCount} />
				),
				meta: { label: t("estimates.table.headers.items") },
			}),
			columnHelper.display({
				id: "status",
				header: t("estimates.table.headers.status"),
				cell: ({ row }) => (
					<div className="flex max-w-56 flex-col items-start gap-1">
						<EstimateStatusBadge
							className="rounded-lg px-2.5 py-1 font-semibold"
							status={row.original.status}
						/>
						{row.original.rejectionReason && (
							<span
								className="line-clamp-2 text-muted-foreground text-xs"
								title={row.original.rejectionReason}
							>
								{row.original.rejectionReason}
							</span>
						)}
					</div>
				),
				meta: { label: t("estimates.table.headers.status") },
			}),
			columnHelper.display({
				id: "validUntil",
				header: t("estimates.table.headers.validUntil"),
				cell: ({ row }) => <EstimateValidityCell estimate={row.original} />,
				meta: { label: t("estimates.table.headers.validUntil") },
			}),
			columnHelper.display({
				id: "total",
				header: () => (
					<div className="text-right">{t("estimates.table.headers.total")}</div>
				),
				cell: ({ row }) => <EstimateTotalCell estimate={row.original} />,
				meta: { label: t("estimates.table.headers.total") },
			}),
			columnHelper.display({
				id: "actions",
				header: () => (
					<span className="sr-only">
						{t("estimates.table.headers.actions")}
					</span>
				),
				cell: ({ row }) => (
					<div className="text-right">
						<EstimateActionsMenu estimate={row.original} />
					</div>
				),
				enableHiding: false,
			}),
		],
		[subdomain, t]
	) as ColumnDef<Estimate>[];
}
