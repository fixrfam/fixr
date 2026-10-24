"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { useParams } from "next/navigation";
import { parseAsString } from "nuqs";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { cn } from "@/lib/utils";
import {
	PICKER_PAGE_SIZE,
	useCatalogAbility,
	usePartsPage,
	useSuppliersPage,
} from "../store";
import { FilterSelect, SortSelect, ToggleFilter } from "./catalog-filters";
import { usePartColumns } from "./columns";
import { toPartRow } from "./data";
import { CATEGORY_OPTIONS } from "./filter-options";
import { TableToolbar } from "./toolbar";
import {
	parseAsBooleanFlag,
	useCatalogParams,
	useCatalogTable,
	useOutOfRangePage,
	useSearchInput,
} from "./use-catalog-table";

const partFilters = {
	category: parseAsString,
	supplierId: parseAsString,
	lowStock: parseAsBooleanFlag(),
};

/** Suppliers matching what the user types in the supplier filter. */
function useSupplierOptions(enabled: boolean) {
	const [search, setSearch] = useState("");
	const onSearchChange = useDebouncedCallback(setSearch, 250);
	const suppliers = useSuppliersPage(
		{ page: 1, perPage: PICKER_PAGE_SIZE, query: search, sort: "name" },
		{ enabled }
	);

	return {
		options: (suppliers.data?.records ?? []).map((supplier) => ({
			label: supplier.name,
			value: supplier.id,
		})),
		loading: suppliers.isFetching,
		onSearchChange,
	};
}

export function PartsTable() {
	const { t } = useTranslation();
	const ability = useCatalogAbility();
	const { subdomain } = useParams<{ subdomain: string }>();
	const columns = usePartColumns(subdomain);
	const { params, refine, setPagination, reset } =
		useCatalogParams(partFilters);
	const search = useSearchInput(params.q, (q) => refine({ q }));
	const canReadSuppliers = ability.can(permissions.suppliers.read);
	const supplierOptions = useSupplierOptions(canReadSuppliers);

	const query = usePartsPage({
		page: params.page,
		perPage: params.perPage,
		query: params.q,
		sort: params.sort,
		category: params.category ?? undefined,
		supplierId: params.supplierId ?? undefined,
		lowStock: params.lowStock === "true",
	});
	useOutOfRangePage(query, params, setPagination);

	const rows = useMemo(
		() => (query.data?.records ?? []).map(toPartRow),
		[query.data]
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
				canCreate={ability.can(permissions.parts.create)}
				createHref="/parts/new"
				createLabel={t("parts.table.create")}
				onClear={reset}
				onSearchChange={search.setInput}
				placeholder={t("parts.table.search")}
				search={search.input}
			>
				<DataTableViewOptions align="end" table={table} />
			</TableToolbar>
			<fieldset
				aria-label={t("dataTable.filters.title")}
				className="m-0 flex min-w-0 flex-wrap items-center gap-2 border-0 p-0"
			>
				<FilterSelect
					onChange={(category) => refine({ category })}
					options={CATEGORY_OPTIONS}
					title={t("parts.table.headers.category")}
					value={params.category}
				/>
				{canReadSuppliers && (
					<FilterSelect
						loading={supplierOptions.loading}
						onChange={(supplierId) => refine({ supplierId })}
						onSearchChange={supplierOptions.onSearchChange}
						options={supplierOptions.options}
						// Every row then has that supplier; its name fills in for an option not loaded.
						selectedLabel={rows[0]?.supplier?.name}
						title={t("parts.table.headers.supplier")}
						value={params.supplierId}
					/>
				)}
				<ToggleFilter
					label={t("parts.table.lowStockFilter")}
					onPressedChange={(pressed) =>
						refine({ lowStock: pressed ? "true" : null })
					}
					pressed={params.lowStock === "true"}
				/>
				<div className="ml-auto">
					<SortSelect
						onChange={(sort) => refine({ sort })}
						value={params.sort}
					/>
				</div>
			</fieldset>
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
