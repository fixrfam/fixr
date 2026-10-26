"use client";

import { useTranslation } from "@fixr/i18n/react";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import type { ServiceOrderRow } from "@/lib/services/service-orders";
import {
	ActionsCell,
	CategoryCell,
	ClientCell,
	DeviceCell,
	IssueCell,
	OrderNumberCell,
	StatusCell,
} from "./cells";

const columnHelper = createColumnHelper<ServiceOrderRow>();

export function useColumns(subdomain: string): ColumnDef<ServiceOrderRow>[] {
	const { t, format } = useTranslation();

	return useMemo(
		() => [
			columnHelper.display({
				id: "order",
				header: t("serviceOrders.table.columns.order"),
				cell: ({ row }) => (
					<OrderNumberCell
						createdAt={row.original.createdAt}
						id={row.original.id}
					/>
				),
				meta: { label: t("serviceOrders.table.columns.order") },
			}),
			columnHelper.display({
				id: "client",
				header: t("serviceOrders.table.columns.client"),
				cell: ({ row }) => <ClientCell client={row.original.client} />,
				meta: { label: t("serviceOrders.table.columns.client") },
			}),
			columnHelper.display({
				id: "device",
				header: t("serviceOrders.table.columns.device"),
				cell: ({ row }) => <DeviceCell order={row.original} />,
				meta: { label: t("serviceOrders.table.columns.device") },
			}),
			columnHelper.display({
				id: "category",
				header: t("serviceOrders.table.columns.category"),
				cell: ({ row }) => (
					<CategoryCell category={row.original.deviceCategory?.name} />
				),
				meta: { label: t("serviceOrders.table.columns.category") },
			}),
			columnHelper.accessor((row) => row.employee.name, {
				id: "technician",
				header: t("serviceOrders.table.columns.technician"),
				meta: { label: t("serviceOrders.table.columns.technician") },
			}),
			columnHelper.display({
				id: "status",
				header: t("serviceOrders.table.columns.status"),
				cell: ({ row }) => <StatusCell status={row.original.status} />,
				meta: { label: t("serviceOrders.table.columns.status") },
			}),
			columnHelper.display({
				id: "issue",
				header: t("serviceOrders.table.columns.issue"),
				cell: ({ row }) => (
					<IssueCell
						description={row.original.reportedDefect}
						notes={row.original.observations}
					/>
				),
				meta: { label: t("serviceOrders.table.columns.issue") },
			}),
			columnHelper.accessor("updatedAt", {
				header: t("serviceOrders.table.columns.update"),
				cell: ({ getValue }) => (
					<span className="text-xs">{format.relativeTime(getValue())}</span>
				),
				meta: { label: t("serviceOrders.table.columns.update") },
			}),
			columnHelper.display({
				id: "actions",
				header: () => (
					<div className="text-right">
						{t("serviceOrders.table.columns.actions")}
					</div>
				),
				cell: ({ row }) => (
					<ActionsCell id={row.original.id} subdomain={subdomain} />
				),
				enableHiding: false,
			}),
		],
		[subdomain, t, format]
	) as ColumnDef<ServiceOrderRow>[];
}
