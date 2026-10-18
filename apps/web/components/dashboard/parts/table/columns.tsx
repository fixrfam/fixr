import {
	type ColumnDef,
	createColumnHelper,
	type Row,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { usePartsStore } from "../store";
import {
	EditCell,
	NameCell,
	PriceCell,
	QuantityCell,
	SkuCell,
	StockCell,
	SupplierCell,
	TextCell,
} from "./cells";
import type { PartTableRow } from "./data";
import { CATEGORY_OPTIONS, STOCK_STATUS_OPTIONS } from "./filter-options";

const partColumnHelper = createColumnHelper<PartTableRow>();

function multiSelectFilter(
	row: Row<PartTableRow>,
	columnId: string,
	filterValue: string[]
) {
	if (!filterValue?.length) return true;
	return filterValue.includes(row.getValue(columnId));
}

export function usePartColumns(subdomain: string): ColumnDef<PartTableRow>[] {
	const suppliers = usePartsStore((state) => state.suppliers);

	return useMemo(
		() => [
			partColumnHelper.accessor("sku", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="SKU" />
				),
				cell: ({ getValue }) => <SkuCell sku={getValue()} />,
				meta: { label: "SKU" },
			}),
			partColumnHelper.accessor("name", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Nome" />
				),
				cell: ({ getValue }) => <NameCell name={getValue()} />,
				meta: { label: "Nome" },
			}),
			partColumnHelper.accessor("category", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Categoria" />
				),
				cell: ({ getValue }) => <TextCell value={getValue()} />,
				enableColumnFilter: true,
				filterFn: multiSelectFilter,
				meta: {
					label: "Categoria",
					variant: "multiSelect",
					options: CATEGORY_OPTIONS,
				},
			}),
			partColumnHelper.accessor("costPrice", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Preço de custo" />
				),
				cell: ({ getValue }) => <PriceCell value={getValue()} />,
				meta: { label: "Preço de custo" },
			}),
			partColumnHelper.accessor("salePrice", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Preço de venda" />
				),
				cell: ({ getValue }) => <PriceCell value={getValue()} />,
				meta: { label: "Preço de venda" },
			}),
			partColumnHelper.accessor("stock", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Estoque" />
				),
				cell: ({ row }) => (
					<StockCell
						status={row.original.stockStatus}
						stock={row.original.stock}
					/>
				),
				meta: { label: "Estoque" },
			}),
			partColumnHelper.accessor("minStock", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Estoque mínimo" />
				),
				cell: ({ getValue }) => <QuantityCell value={getValue()} />,
				meta: { label: "Estoque mínimo" },
			}),
			partColumnHelper.accessor("supplierId", {
				id: "supplier",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Fornecedor" />
				),
				cell: ({ row }) => (
					<SupplierCell
						cnpj={row.original.supplier?.cnpj}
						name={row.original.supplier?.name}
					/>
				),
				sortingFn: (a, b) =>
					(a.original.supplier?.name ?? "").localeCompare(
						b.original.supplier?.name ?? ""
					),
				enableColumnFilter: true,
				filterFn: multiSelectFilter,
				meta: {
					label: "Fornecedor",
					variant: "multiSelect",
					options: suppliers.map((s) => ({ label: s.name, value: s.id })),
				},
			}),
			partColumnHelper.accessor("stockStatus", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Status de estoque" />
				),
				enableColumnFilter: true,
				enableHiding: false,
				filterFn: multiSelectFilter,
				meta: {
					label: "Status de estoque",
					variant: "multiSelect",
					options: STOCK_STATUS_OPTIONS,
				},
			}),
			partColumnHelper.display({
				id: "actions",
				header: ({ column }) => (
					<DataTableColumnHeader
						className="px-0.5"
						column={column}
						label="Editar"
					/>
				),
				cell: ({ row }) => (
					<EditCell
						href={`/parts/${row.original.id}/edit`}
						label={`Editar ${row.original.name}`}
						subdomain={subdomain}
					/>
				),
				enableSorting: false,
				enableHiding: false,
			}),
		],
		[subdomain, suppliers]
	) as ColumnDef<PartTableRow>[];
}
