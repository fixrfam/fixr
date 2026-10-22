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
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useServiceRows } from "@/components/dashboard/parts/store";
import { searchServices } from "@/components/dashboard/parts/table/data";
import { TableToolbar } from "@/components/dashboard/parts/table/toolbar";
import { DataTable } from "@/components/ui/data-table";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import { useServiceColumns } from "./columns";

export function ServicesTable() {
	const { t } = useTranslation();
	const router = useRouter();
	const { subdomain } = useParams<{ subdomain: string }>();
	const [search, setSearch] = useState("");
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "name", desc: false },
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const columns = useServiceColumns(subdomain);

	const handleRowClick = useCallback(
		(row: { original: { id: string } }) => {
			router.push(`/dashboard/${subdomain}/services/${row.original.id}`);
		},
		[router, subdomain]
	);

	const rows = useServiceRows();

	const filteredData = useMemo(
		() => searchServices(rows, search),
		[rows, search]
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
		},
	});

	return (
		<div className="space-y-4">
			<TableToolbar
				createHref="/services/new"
				createLabel={t("services.table.create")}
				onClear={() => {
					setSearch("");
					setColumnFilters([]);
				}}
				onSearchChange={setSearch}
				placeholder={t("services.table.search")}
				search={search}
			>
				<DataTableViewOptions align="end" table={table} />
			</TableToolbar>
			<DataTable className="w-full" onRowClick={handleRowClick} table={table}>
				<DataTableToolbar showViewOptions={false} table={table} />
			</DataTable>
		</div>
	);
}
