import {
	type ColumnDef,
	createColumnHelper,
	type Row,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { usePartsStore } from "../store";
import {
	ContactCell,
	DurationCell,
	EditCell,
	LinkedItemsCell,
	NameCell,
	PriceCell,
	QuantityCell,
	SkuCell,
	StockCell,
	SupplierCell,
	TextCell,
} from "./cells";
import type { PartTableRow, ServiceTableRow, SupplierTableRow } from "./data";
import {
	CATEGORY_OPTIONS,
	DEVICE_CATEGORY_OPTIONS,
	STOCK_STATUS_OPTIONS,
} from "./filter-options";

const partColumnHelper = createColumnHelper<PartTableRow>();
const serviceColumnHelper = createColumnHelper<ServiceTableRow>();
const supplierColumnHelper = createColumnHelper<SupplierTableRow>();

function multiSelectFilter(
	row: Row<PartTableRow>,
	columnId: string,
	filterValue: string[]
) {
	if (!filterValue?.length) return true;
	return filterValue.includes(row.getValue(columnId));
}

function deviceCategoriesFilter(
	row: Row<ServiceTableRow>,
	_columnId: string,
	filterValue: string[]
) {
	if (!filterValue?.length) return true;
	return row.original.deviceCategories.some((c) => filterValue.includes(c));
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

export function useServiceColumns(
	subdomain: string
): ColumnDef<ServiceTableRow>[] {
	return useMemo(
		() => [
			serviceColumnHelper.accessor("name", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Nome" />
				),
				cell: ({ getValue }) => <NameCell clickable name={getValue()} />,
				meta: { label: "Nome" },
			}),
			serviceColumnHelper.accessor("description", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Descrição" />
				),
				cell: ({ getValue }) => (
					<span className="block max-w-80 truncate text-2xs">{getValue()}</span>
				),
				meta: { label: "Descrição" },
			}),
			serviceColumnHelper.accessor("deviceCategories", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Categorias" />
				),
				cell: ({ getValue }) => (
					<LinkedItemsCell
						emptyLabel="Sem categoria"
						items={getValue().map((category) => ({
							id: category,
							label: category,
						}))}
					/>
				),
				sortingFn: (a, b) =>
					a.original.deviceCategories
						.join(", ")
						.localeCompare(b.original.deviceCategories.join(", ")),
				enableColumnFilter: true,
				filterFn: deviceCategoriesFilter,
				getUniqueValues: (row) => row.deviceCategories,
				meta: {
					label: "Categorias",
					variant: "multiSelect",
					options: DEVICE_CATEGORY_OPTIONS,
				},
			}),
			serviceColumnHelper.accessor("estimatedDurationMinutes", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Duração estimada" />
				),
				cell: ({ getValue }) => <DurationCell minutes={getValue()} />,
				meta: { label: "Duração estimada" },
			}),
			serviceColumnHelper.accessor("price", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Preço" />
				),
				cell: ({ getValue }) => <PriceCell value={getValue()} />,
				meta: { label: "Preço" },
			}),
			serviceColumnHelper.accessor((row) => row.parts.length, {
				id: "parts",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Peças vinculadas" />
				),
				cell: ({ row }) => (
					<LinkedItemsCell
						emptyLabel="Sem peças"
						items={row.original.parts.map((part) => ({
							id: part.id,
							label: part.name,
						}))}
					/>
				),
				meta: { label: "Peças vinculadas" },
			}),
			serviceColumnHelper.display({
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
						href={`/parts/services/${row.original.id}/edit`}
						label={`Editar ${row.original.name}`}
						subdomain={subdomain}
					/>
				),
				enableSorting: false,
				enableHiding: false,
			}),
		],
		[subdomain]
	) as ColumnDef<ServiceTableRow>[];
}

export function useSupplierColumns(): ColumnDef<SupplierTableRow>[] {
	return useMemo(
		() => [
			supplierColumnHelper.accessor("name", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Nome" />
				),
				cell: ({ getValue }) => <NameCell name={getValue()} />,
				meta: { label: "Nome" },
			}),
			supplierColumnHelper.accessor("cnpj", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="CNPJ" />
				),
				cell: ({ getValue }) => (
					<span className="whitespace-nowrap tabular-nums">{getValue()}</span>
				),
				meta: { label: "CNPJ" },
			}),
			supplierColumnHelper.accessor("contact", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Contato" />
				),
				cell: ({ getValue }) => <ContactCell primary={getValue()} />,
				meta: { label: "Contato" },
			}),
			supplierColumnHelper.accessor("phone", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Telefone" />
				),
				cell: ({ getValue }) => (
					<span className="whitespace-nowrap tabular-nums">{getValue()}</span>
				),
				meta: { label: "Telefone" },
			}),
			supplierColumnHelper.accessor("email", {
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Email" />
				),
				cell: ({ getValue }) => <TextCell value={getValue()} />,
				meta: { label: "Email" },
			}),
			supplierColumnHelper.accessor((row) => row.parts.length, {
				id: "partsCount",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} label="Qtd. de peças" />
				),
				cell: ({ getValue }) => <QuantityCell value={getValue()} />,
				meta: { label: "Qtd. de peças" },
			}),
		],
		[]
	) as ColumnDef<SupplierTableRow>[];
}
