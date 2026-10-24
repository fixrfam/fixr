import { useTranslation } from "@fixr/i18n/react";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { CopyableValue } from "@/components/dashboard/copyable-value";
import {
	ContactCell,
	NameCell,
	QuantityCell,
} from "@/components/dashboard/parts/table/cells";
import type { SupplierTableRow } from "@/components/dashboard/parts/table/data";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCnpj, formatPhone } from "@/lib/format";

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
					<CopyableValue
						label={t("suppliers.table.headers.cnpj")}
						value={formatCnpj(getValue())}
					/>
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
					<CopyableValue
						label={t("suppliers.table.headers.phone")}
						value={formatPhone(getValue())}
					/>
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
				cell: ({ getValue }) => (
					<CopyableValue
						className="text-2xs"
						label={t("suppliers.table.headers.email")}
						value={getValue()}
					/>
				),
				meta: { label: t("suppliers.table.headers.email") },
			}),
			supplierColumnHelper.accessor("partsCount", {
				header: ({ column }) => (
					<DataTableColumnHeader
						column={column}
						label={t("suppliers.table.headers.partsCount")}
					/>
				),
				cell: ({ getValue }) => {
					const value = getValue();
					// Counted per row, after the page itself loads.
					return value === undefined ? (
						<Skeleton className="h-5 w-8" />
					) : (
						<QuantityCell value={value} />
					);
				},
				meta: { label: t("suppliers.table.headers.partsCount") },
			}),
		],
		[t]
	) as ColumnDef<SupplierTableRow>[];
}
