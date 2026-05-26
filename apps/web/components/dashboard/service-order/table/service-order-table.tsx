"use client";

import { mockServiceOrders } from "@fixr/mock";
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
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { useColumns } from "./columns";
import { TableToolbar } from "./toolbar";

interface Props {
	subdomain: string;
}

export function ServiceOrdersTable({ subdomain }: Props) {
	const router = useRouter();
	const [search, setSearch] = useState("");
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "updatedAt", desc: true },
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const columns = useColumns(subdomain);

	const handleRowClick = useCallback(
		(row: { original: { id: string } }) => {
			router.push(`/dashboard/${subdomain}/service-orders/${row.original.id}`);
		},
		[router, subdomain]
	);

	const filteredData = useMemo(() => {
		const value = search.trim().toLowerCase();
		if (!value) return mockServiceOrders;

		return mockServiceOrders.filter((row) => {
			const searchable = [
				row.orderNumber,
				row.client.name,
				row.client.phone,
				row.client.cpf,
				row.mark,
				row.model,
				row.line,
				row.technician,
				row.status.label,
				row.orderDetails?.imei,
				row.orderDetails?.description,
			]
				.filter((v): v is string => Boolean(v))
				.map((v) => v.toLowerCase());

			return searchable.some((v) => v.includes(value));
		});
	}, [search]);

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
				onClear={() => {
					setSearch("");
					setColumnFilters([]);
				}}
				onSearchChange={setSearch}
				search={search}
			/>
			<DataTable className="w-full" onRowClick={handleRowClick} table={table}>
				<DataTableToolbar table={table} />
			</DataTable>
		</div>
	);
}
