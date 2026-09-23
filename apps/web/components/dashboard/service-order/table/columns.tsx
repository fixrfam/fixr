"use client";

import { useTranslation } from "@fixr/i18n/react";
import type { ServiceOrderRow } from "@fixr/mock";
import {
	type ColumnDef,
	createColumnHelper,
	type Row,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { serviceOrderStatusKeys } from "@/lib/i18n/labels";
import {
	ActionsCell,
	CategoryCell,
	ClientCell,
	DeviceCell,
	IssueCell,
	OrderNumberCell,
	PartsCell,
	StatusCell,
	TechnicianCell,
	UpdatedAtCell,
} from "./cells";
import {
	CATEGORY_OPTIONS,
	TECH_OPTIONS,
	useStatusOptions,
} from "./filter-options";

const columnHelper = createColumnHelper<ServiceOrderRow>();

function multiSelectFilter(
	row: Row<ServiceOrderRow>,
	columnId: string,
	filterValue: string[]
) {
	if (!filterValue?.length) return true;
	return filterValue.includes(row.getValue(columnId));
}

export function useColumns(subdomain: string): ColumnDef<ServiceOrderRow>[] {
	const { t } = useTranslation();
	const statusOptions = useStatusOptions();

	return useMemo(
		() => [
			columnHelper.accessor("orderNumber", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("serviceOrders.table.columns.order")}
					/>
				),
				cell: ({ getValue, row }) => (
					<OrderNumberCell
						orderNumber={getValue()}
						receivedAt={row.original.orderDetails?.receivedAt}
					/>
				),
				meta: { label: t("serviceOrders.table.columns.order") },
			}),
			columnHelper.accessor((row) => row.client.name, {
				id: "client",
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("serviceOrders.table.columns.client")}
					/>
				),
				cell: ({ row }) => (
					<ClientCell
						cpf={row.original.client.cpf}
						name={row.original.client.name}
						phone={row.original.client.phone}
					/>
				),
				meta: { label: t("serviceOrders.table.columns.client") },
			}),
			columnHelper.accessor((row) => `${row.mark} ${row.model}`.trim(), {
				id: "device",
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("serviceOrders.table.columns.device")}
					/>
				),
				cell: ({ row }) => (
					<DeviceCell
						imei={row.original.orderDetails?.imei}
						mark={row.original.mark}
						model={row.original.model}
					/>
				),
				meta: { label: t("serviceOrders.table.columns.device") },
			}),
			columnHelper.accessor("category", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("serviceOrders.table.columns.category")}
					/>
				),
				cell: ({ getValue }) => <CategoryCell category={getValue()} />,
				enableColumnFilter: true,
				filterFn: multiSelectFilter,
				meta: {
					label: t("serviceOrders.table.columns.category"),
					variant: "multiSelect",
					options: CATEGORY_OPTIONS,
				},
			}),
			columnHelper.accessor("technician", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("serviceOrders.table.columns.technician")}
					/>
				),
				cell: ({ getValue }) => <TechnicianCell name={getValue()} />,
				enableColumnFilter: true,
				filterFn: multiSelectFilter,
				meta: {
					label: t("serviceOrders.table.columns.technician"),
					variant: "multiSelect",
					options: TECH_OPTIONS,
				},
			}),
			columnHelper.accessor((row) => row.status.id, {
				id: "status",
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("serviceOrders.table.columns.status")}
					/>
				),
				cell: ({ row }) => (
					<StatusCell
						label={t(serviceOrderStatusKeys[row.original.status.id])}
						statusId={row.original.status.id}
					/>
				),
				enableColumnFilter: true,
				filterFn: multiSelectFilter,
				meta: {
					label: t("serviceOrders.table.columns.status"),
					variant: "multiSelect",
					options: statusOptions,
				},
			}),
			columnHelper.accessor((row) => row.orderDetails?.description ?? "", {
				id: "issue",
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("serviceOrders.table.columns.issue")}
					/>
				),
				cell: ({ row }) => (
					<IssueCell
						description={row.original.orderDetails?.description}
						notes={row.original.notes}
					/>
				),
				meta: { label: t("serviceOrders.table.columns.issue") },
			}),
			columnHelper.accessor((row) => row.parts?.length ?? 0, {
				id: "parts",
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("serviceOrders.table.columns.parts")}
					/>
				),
				cell: ({ row }) => <PartsCell parts={row.original.parts} />,
				meta: { label: t("serviceOrders.table.columns.parts") },
			}),
			columnHelper.accessor((row) => row.history.at(-1)?.dateTime ?? "", {
				id: "updatedAt",
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("serviceOrders.table.columns.update")}
					/>
				),
				cell: ({ row }) => <UpdatedAtCell history={row.original.history} />,
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
				enableSorting: false,
				enableHiding: false,
			}),
		],
		[subdomain, t, statusOptions]
	) as ColumnDef<ServiceOrderRow>[];
}
