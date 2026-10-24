import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { AdjustStockDialog } from "../forms/adjust-stock-dialog";
import { useCatalogAbility } from "../store";
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

const partColumnHelper = createColumnHelper<PartTableRow>();

export function usePartColumns(subdomain: string): ColumnDef<PartTableRow>[] {
	const { t } = useTranslation();
	const ability = useCatalogAbility();
	const canEdit = ability.can(permissions.parts.update);
	const canAdjust = ability.can(permissions.inventory.adjust);

	return useMemo(
		() => [
			partColumnHelper.accessor("sku", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("parts.table.headers.sku")}
					/>
				),
				cell: ({ getValue }) => <SkuCell sku={getValue()} />,
				meta: { label: t("parts.table.headers.sku") },
			}),
			partColumnHelper.accessor("name", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("parts.table.headers.name")}
					/>
				),
				cell: ({ getValue }) => <NameCell name={getValue()} />,
				meta: { label: t("parts.table.headers.name") },
			}),
			partColumnHelper.accessor("category", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("parts.table.headers.category")}
					/>
				),
				cell: ({ getValue }) => <TextCell value={getValue()} />,
				meta: { label: t("parts.table.headers.category") },
			}),
			partColumnHelper.accessor("costPrice", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("parts.table.headers.costPrice")}
					/>
				),
				cell: ({ getValue }) => <PriceCell value={getValue()} />,
				meta: { label: t("parts.table.headers.costPrice") },
			}),
			partColumnHelper.accessor("salePrice", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("parts.table.headers.salePrice")}
					/>
				),
				cell: ({ getValue }) => <PriceCell value={getValue()} />,
				meta: { label: t("parts.table.headers.salePrice") },
			}),
			partColumnHelper.accessor("stock", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("parts.table.headers.stock")}
					/>
				),
				cell: ({ row }) => (
					<StockCell
						status={row.original.stockStatus}
						stock={row.original.stock}
					/>
				),
				meta: { label: t("parts.table.headers.stock") },
			}),
			partColumnHelper.accessor("minStock", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("parts.table.headers.minStock")}
					/>
				),
				cell: ({ getValue }) => <QuantityCell value={getValue()} />,
				meta: { label: t("parts.table.headers.minStock") },
			}),
			partColumnHelper.accessor("supplierId", {
				id: "supplier",
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("parts.table.headers.supplier")}
					/>
				),
				// The API embeds the supplier's name, readable even without `suppliers:read`.
				cell: ({ row }) => <SupplierCell name={row.original.supplier?.name} />,
				meta: { label: t("parts.table.headers.supplier") },
			}),
			// Shown only to roles with at least one of the row actions.
			...(canEdit || canAdjust
				? [
						partColumnHelper.display({
							id: "actions",
							header: ({ column }) => (
								<DataTableColumnHeader
									className="px-0.5"
									column={column}
									label={t("parts.table.headers.actions")}
								/>
							),
							cell: ({ row }) => (
								<div className="flex items-center gap-2">
									{canAdjust && <AdjustStockDialog part={row.original} />}
									{canEdit && (
										<EditCell
											href={`/parts/${row.original.id}/edit`}
											label={t("parts.table.editLabel", {
												name: row.original.name,
											})}
											subdomain={subdomain}
										/>
									)}
								</div>
							),
							enableSorting: false,
							enableHiding: false,
						}),
					]
				: []),
		],
		[subdomain, t, canEdit, canAdjust]
	) as ColumnDef<PartTableRow>[];
}
