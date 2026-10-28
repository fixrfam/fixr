import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import {
	DurationCell,
	EditCell,
	LinkedItemsCell,
	NameCell,
	ServicePriceCell,
} from "@/components/dashboard/parts/table/cells";
import type { ServiceTableRow } from "@/components/dashboard/parts/table/data";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Skeleton } from "@/components/ui/skeleton";

const serviceColumnHelper = createColumnHelper<ServiceTableRow>();

export function useServiceColumns(
	subdomain: string
): ColumnDef<ServiceTableRow>[] {
	const { t } = useTranslation();
	const canEdit = useCatalogAbility().can(permissions.services.update);

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
				meta: { label: t("services.table.headers.categories") },
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
			serviceColumnHelper.accessor("totalPrice", {
				id: "price",
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("services.table.headers.price")}
					/>
				),
				cell: ({ row }) => <ServicePriceCell service={row.original} />,
				meta: { label: t("services.table.headers.price") },
			}),
			serviceColumnHelper.accessor((row) => row.partIds.length, {
				id: "parts",
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("services.table.headers.parts")}
					/>
				),
				cell: ({ row }) =>
					// Part names load per part, after the page itself.
					row.original.partsPending ? (
						<Skeleton className="h-5 w-24" />
					) : (
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
			...(canEdit
				? [
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
									label={t("services.table.editLabel", {
										name: row.original.name,
									})}
									subdomain={subdomain}
								/>
							),
							enableSorting: false,
							enableHiding: false,
						}),
					]
				: []),
		],
		[subdomain, t, canEdit]
	) as ColumnDef<ServiceTableRow>[];
}
