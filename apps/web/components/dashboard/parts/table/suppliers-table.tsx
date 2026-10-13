"use client";

import {
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import { useSupplierRows } from "../store";
import { useSupplierColumns } from "./columns";
import { searchSuppliers } from "./data";
import { TableToolbar } from "./toolbar";

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
