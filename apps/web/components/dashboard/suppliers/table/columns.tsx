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
