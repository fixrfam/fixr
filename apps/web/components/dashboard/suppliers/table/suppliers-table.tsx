"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { useMemo } from "react";
import {
	useCatalogAbility,
	useSupplierPartCounts,
	useSuppliersPage,
} from "@/components/dashboard/parts/store";
import { SortSelect } from "@/components/dashboard/parts/table/catalog-filters";
import { TableToolbar } from "@/components/dashboard/parts/table/toolbar";
import {
	useCatalogParams,
	useCatalogTable,
	useOutOfRangePage,
	useSearchInput,
} from "@/components/dashboard/parts/table/use-catalog-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSupplierColumns } from "./columns";

const supplierFilters = {};

export function SuppliersTable() {
	const { t } = useTranslation();
	const ability = useCatalogAbility();
	const columns = useSupplierColumns();
	const { params, refine, setPagination, reset } =
		useCatalogParams(supplierFilters);
	const search = useSearchInput(params.q, (q) => refine({ q }));

	const query = useSuppliersPage({
		page: params.page,
		perPage: params.perPage,
		query: params.q,
		sort: params.sort,
	});
	useOutOfRangePage(query, params, setPagination);

	const suppliers = query.data?.records;
	const partCounts = useSupplierPartCounts(
		(suppliers ?? []).map((supplier) => supplier.id)
	);
	const rows = useMemo(
		() =>
			(suppliers ?? []).map((supplier) => ({
				...supplier,
				partsCount: partCounts.get(supplier.id),
			})),
		[suppliers, partCounts]
	);

	const table = useCatalogTable({
		data: rows,
		columns,
		page: params.page,
		perPage: params.perPage,
		pageCount: query.data?.pagination.total_pages ?? 0,
		rowCount: query.data?.pagination.total_records ?? 0,
		onPaginationChange: setPagination,
	});

	return (
		<div className="space-y-4">
			<TableToolbar
				canCreate={ability.can(permissions.suppliers.create)}
				createHref="/suppliers/new"
				createLabel={t("suppliers.table.create")}
				onClear={reset}
				onSearchChange={search.setInput}
				placeholder={t("suppliers.table.search")}
				search={search.input}
			>
				<DataTableViewOptions align="end" table={table} />
			</TableToolbar>
			<div className="flex items-center justify-end">
				<SortSelect onChange={(sort) => refine({ sort })} value={params.sort} />
			</div>
			{query.isPending ? (
				<Skeleton className="h-96 w-full rounded-md" />
			) : (
				<DataTable
					aria-busy={query.isPlaceholderData}
					className={cn(
						"w-full transition-opacity",
						query.isPlaceholderData && "opacity-60"
					)}
					table={table}
				/>
			)}
		</div>
	);
}
