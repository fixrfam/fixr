import { useTranslation } from "@fixr/i18n/react";
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
	const { t } = useTranslation();

	return useMemo(
		() => [
			serviceColumnHelper.accessor("name", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("services.table.headers.name")}
					/>
				),
				cell: ({ getValue }) => <NameCell clickable name={getValue()} />,
				meta: { label: t("services.table.headers.name") },
			}),
			serviceColumnHelper.accessor("description", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("services.table.headers.description")}
					/>
				),
				cell: ({ getValue }) => (
					<span className="block max-w-80 truncate text-2xs">{getValue()}</span>
				),
				meta: { label: t("services.table.headers.description") },
			}),
			serviceColumnHelper.accessor("deviceCategories", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("services.table.headers.categories")}
					/>
				),
				cell: ({ getValue }) => (
					<LinkedItemsCell
						emptyLabel={t("services.table.noCategory")}
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
					label: t("services.table.headers.categories"),
					variant: "multiSelect",
					options: DEVICE_CATEGORY_OPTIONS,
				},
			}),
			serviceColumnHelper.accessor("estimatedDurationMinutes", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("services.table.headers.duration")}
					/>
				),
				cell: ({ getValue }) => <DurationCell minutes={getValue()} />,
				meta: { label: t("services.table.headers.duration") },
			}),
			serviceColumnHelper.accessor("price", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("services.table.headers.price")}
					/>
				),
				cell: ({ getValue }) => <PriceCell value={getValue()} />,
				meta: { label: t("services.table.headers.price") },
			}),
			serviceColumnHelper.accessor((row) => row.parts.length, {
				id: "parts",
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("services.table.headers.parts")}
					/>
				),
				cell: ({ row }) => (
					<LinkedItemsCell
						emptyLabel={t("services.table.noParts")}
						items={row.original.parts.map((part) => ({
							id: part.id,
							label: part.name,
						}))}
					/>
				),
				meta: { label: t("services.table.headers.parts") },
			}),
			serviceColumnHelper.display({
				id: "actions",
				header: ({ column }) => (
					<DataTableColumnHeader
						className="px-0.5"
						column={column}
						label={t("services.table.headers.actions")}
					/>
				),
				cell: ({ row }) => (
					<EditCell
						href={`/services/${row.original.id}/edit`}
						label={t("services.table.editLabel", { name: row.original.name })}
						subdomain={subdomain}
					/>
				),
				enableSorting: false,
				enableHiding: false,
			}),
		],
		[subdomain, t]
	) as ColumnDef<ServiceTableRow>[];
}
