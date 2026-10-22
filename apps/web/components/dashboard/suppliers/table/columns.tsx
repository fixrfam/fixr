import { useTranslation } from "@fixr/i18n/react";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import {
	ContactCell,
	NameCell,
	QuantityCell,
	TextCell,
} from "@/components/dashboard/parts/table/cells";
import type { SupplierTableRow } from "@/components/dashboard/parts/table/data";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

const supplierColumnHelper = createColumnHelper<SupplierTableRow>();

export function useSupplierColumns(): ColumnDef<SupplierTableRow>[] {
	const { t } = useTranslation();

	return useMemo(
		() => [
			supplierColumnHelper.accessor("name", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("suppliers.table.headers.name")}
					/>
				),
				cell: ({ getValue }) => <NameCell name={getValue()} />,
				meta: { label: t("suppliers.table.headers.name") },
			}),
			supplierColumnHelper.accessor("cnpj", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("suppliers.table.headers.cnpj")}
					/>
				),
				cell: ({ getValue }) => (
					<span className="whitespace-nowrap tabular-nums">{getValue()}</span>
				),
				meta: { label: t("suppliers.table.headers.cnpj") },
			}),
			supplierColumnHelper.accessor("contact", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("suppliers.table.headers.contact")}
					/>
				),
				cell: ({ getValue }) => <ContactCell primary={getValue()} />,
				meta: { label: t("suppliers.table.headers.contact") },
			}),
			supplierColumnHelper.accessor("phone", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("suppliers.table.headers.phone")}
					/>
				),
				cell: ({ getValue }) => (
					<span className="whitespace-nowrap tabular-nums">{getValue()}</span>
				),
				meta: { label: t("suppliers.table.headers.phone") },
			}),
			supplierColumnHelper.accessor("email", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("suppliers.table.headers.email")}
					/>
				),
				cell: ({ getValue }) => <TextCell value={getValue()} />,
				meta: { label: t("suppliers.table.headers.email") },
			}),
			supplierColumnHelper.accessor((row) => row.parts.length, {
				id: "partsCount",
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("suppliers.table.headers.partsCount")}
					/>
				),
				cell: ({ getValue }) => <QuantityCell value={getValue()} />,
				meta: { label: t("suppliers.table.headers.partsCount") },
			}),
		],
		[t]
	) as ColumnDef<SupplierTableRow>[];
}
