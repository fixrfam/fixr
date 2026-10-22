import {
	type ColumnDef,
	createColumnHelper,
	type Row,
} from "@tanstack/react-table";
import { useMemo } from "react";
import {
	DurationCell,
	EditCell,
	LinkedItemsCell,
	NameCell,
	PriceCell,
} from "@/components/dashboard/parts/table/cells";
import type { ServiceTableRow } from "@/components/dashboard/parts/table/data";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DEVICE_CATEGORY_OPTIONS } from "./filter-options";

const serviceColumnHelper = createColumnHelper<ServiceTableRow>();

function deviceCategoriesFilter(
	row: Row<ServiceTableRow>,
	_columnId: string,
	filterValue: string[]
) {
	if (!filterValue?.length) return true;
	return row.original.deviceCategories.some((c) => filterValue.includes(c));
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
						href={`/services/${row.original.id}/edit`}
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
