"use client";

import { useTranslation } from "@fixr/i18n/react";
import {
	type ColumnFiltersState,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import { Skeleton } from "@/components/ui/skeleton";
import { useInventory, usePartRows } from "../store";
import { usePartColumns } from "./columns";
import { STOCK_STATUS_KEYS, searchParts } from "./data";
import { TableToolbar } from "./toolbar";

export function PartsTable() {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "name", desc: false },
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const { subdomain } = useParams<{ subdomain: string }>();
	const columns = usePartColumns(subdomain);

	const rows = usePartRows();
	const { isPending } = useInventory();

	const filteredData = useMemo(
		() => searchParts(rows, search, (status) => t(STOCK_STATUS_KEYS[status])),
		[rows, search, t]
	);

	const table = useReactTable({
		data: filteredData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		state: { sorting, columnFilters },
		initialState: {
			pagination: { pageIndex: 0, pageSize: 10 },
			// Only used as the stock status filter; shown inside the stock column
			columnVisibility: { stockStatus: false },
		},
	});

	return (
		<div className="space-y-4">
			<TableToolbar
				createHref="/parts/new"
				createLabel={t("parts.table.create")}
				onClear={() => {
					setSearch("");
					setColumnFilters([]);
				}}
				onSearchChange={setSearch}
				placeholder={t("parts.table.search")}
				search={search}
			>
				<DataTableViewOptions align="end" table={table} />
			</TableToolbar>
			{isPending ? (
				<Skeleton className="h-96 w-full rounded-md" />
			) : (
				<DataTable className="w-full" table={table}>
					<DataTableToolbar showViewOptions={false} table={table} />
				</DataTable>
			)}
		</div>
	);
}
