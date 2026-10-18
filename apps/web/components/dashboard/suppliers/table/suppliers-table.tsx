"use client";

import {
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useSupplierRows } from "@/components/dashboard/parts/store";
import { searchSuppliers } from "@/components/dashboard/parts/table/data";
import { TableToolbar } from "@/components/dashboard/parts/table/toolbar";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import { useSupplierColumns } from "./columns";

export function SuppliersTable() {
	const [search, setSearch] = useState("");
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "name", desc: false },
	]);

	const columns = useSupplierColumns();

	const rows = useSupplierRows();

	const filteredData = useMemo(
		() => searchSuppliers(rows, search),
		[rows, search]
	);

	const table = useReactTable({
		data: filteredData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		state: { sorting },
		initialState: {
			pagination: { pageIndex: 0, pageSize: 10 },
		},
	});

	return (
		<div className="space-y-4">
			<TableToolbar
				createHref="/suppliers/new"
				createLabel="Novo fornecedor"
				onClear={() => setSearch("")}
				onSearchChange={setSearch}
				placeholder="Busque por fornecedor, CNPJ, contato, telefone, email ou peça..."
				search={search}
			>
				<DataTableViewOptions align="end" table={table} />
			</TableToolbar>
			<DataTable className="w-full" table={table} />
		</div>
	);
}
