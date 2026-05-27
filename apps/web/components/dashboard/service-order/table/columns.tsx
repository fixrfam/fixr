import type { ServiceOrderRow } from "@fixr/mock";
import {
	type ColumnDef,
	createColumnHelper,
	type Row,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
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
	STATUS_OPTIONS,
	TECH_OPTIONS,
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
	return useMemo(
		() => [
			columnHelper.accessor("orderNumber", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Ordem" />
				),
				cell: ({ getValue, row }) => (
					<OrderNumberCell
						orderNumber={getValue()}
						receivedAt={row.original.orderDetails?.receivedAt}
					/>
				),
				meta: { label: "Ordem" },
			}),
			columnHelper.accessor((row) => row.client.name, {
				id: "client",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Cliente" />
				),
				cell: ({ row }) => (
					<ClientCell
						cpf={row.original.client.cpf}
						name={row.original.client.name}
						phone={row.original.client.phone}
					/>
				),
				meta: { label: "Cliente" },
			}),
			columnHelper.accessor((row) => `${row.mark} ${row.model}`.trim(), {
				id: "device",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Aparelho" />
				),
				cell: ({ row }) => (
					<DeviceCell
						imei={row.original.orderDetails?.imei}
						mark={row.original.mark}
						model={row.original.model}
					/>
				),
				meta: { label: "Aparelho" },
			}),
			columnHelper.accessor("category", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Categoria" />
				),
				cell: ({ getValue }) => <CategoryCell category={getValue()} />,
				enableColumnFilter: true,
				filterFn: multiSelectFilter,
				meta: {
					label: "Categoria",
					variant: "multiSelect",
					options: CATEGORY_OPTIONS,
				},
			}),
			columnHelper.accessor("technician", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Técnico" />
				),
				cell: ({ getValue }) => <TechnicianCell name={getValue()} />,
				enableColumnFilter: true,
				filterFn: multiSelectFilter,
				meta: {
					label: "Técnico",
					variant: "multiSelect",
					options: TECH_OPTIONS,
				},
			}),
			columnHelper.accessor((row) => row.status.id, {
				id: "status",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Status" />
				),
				cell: ({ row }) => (
					<StatusCell
						label={row.original.status.label}
						statusId={row.original.status.id}
					/>
				),
				enableColumnFilter: true,
				filterFn: multiSelectFilter,
				meta: {
					label: "Status",
					variant: "multiSelect",
					options: STATUS_OPTIONS,
				},
			}),
			columnHelper.accessor((row) => row.orderDetails?.description ?? "", {
				id: "issue",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Defeito" />
				),
				cell: ({ row }) => (
					<IssueCell
						description={row.original.orderDetails?.description}
						notes={row.original.notes}
					/>
				),
				meta: { label: "Defeito" },
			}),
			columnHelper.accessor((row) => row.parts?.length ?? 0, {
				id: "parts",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Peças" />
				),
				cell: ({ row }) => <PartsCell parts={row.original.parts} />,
				meta: { label: "Peças" },
			}),
			columnHelper.accessor((row) => row.history.at(-1)?.dateTime ?? "", {
				id: "updatedAt",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Atualização" />
				),
				cell: ({ row }) => <UpdatedAtCell history={row.original.history} />,
				meta: { label: "Atualização" },
			}),
			columnHelper.display({
				id: "actions",
				header: () => <div className="text-right">Ações</div>,
				cell: ({ row }) => (
					<ActionsCell id={row.original.id} subdomain={subdomain} />
				),
				enableSorting: false,
				enableHiding: false,
			}),
		],
		[subdomain]
	) as ColumnDef<ServiceOrderRow>[];
}
