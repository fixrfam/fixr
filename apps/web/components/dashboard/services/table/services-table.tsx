"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { useParams, useRouter } from "next/navigation";
import { parseAsString } from "nuqs";
import { useCallback } from "react";
import {
	useCatalogAbility,
	useServicesPage,
	useServicesWithParts,
} from "@/components/dashboard/parts/store";
import {
	FilterSelect,
	SortSelect,
} from "@/components/dashboard/parts/table/catalog-filters";
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
import { useServiceColumns } from "./columns";
import { DEVICE_CATEGORY_OPTIONS } from "./filter-options";

const serviceFilters = { deviceCategory: parseAsString };

export function ServicesTable() {
	const { t } = useTranslation();
	const ability = useCatalogAbility();
	const router = useRouter();
	const { subdomain } = useParams<{ subdomain: string }>();
	const columns = useServiceColumns(subdomain);
	const { params, refine, setPagination, reset } =
		useCatalogParams(serviceFilters);
	const search = useSearchInput(params.q, (q) => refine({ q }));

	const handleRowClick = useCallback(
		(row: { original: { id: string } }) => {
			router.push(`/dashboard/${subdomain}/services/${row.original.id}`);
		},
		[router, subdomain]
	);

	const query = useServicesPage({
		page: params.page,
		perPage: params.perPage,
		query: params.q,
		sort: params.sort,
		deviceCategory: params.deviceCategory ?? undefined,
	});
	useOutOfRangePage(query, params, setPagination);
	const rows = useServicesWithParts(query.data?.records ?? EMPTY);

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
				canCreate={ability.can(permissions.services.create)}
				createHref="/services/new"
				createLabel={t("services.table.create")}
				onClear={reset}
				onSearchChange={search.setInput}
				placeholder={t("services.table.search")}
				search={search.input}
			>
				<DataTableViewOptions align="end" table={table} />
			</TableToolbar>
			<div
				aria-label={t("dataTable.filters.title")}
				className="flex flex-wrap items-center gap-2"
				role="group"
			>
				<FilterSelect
					onChange={(deviceCategory) => refine({ deviceCategory })}
					options={DEVICE_CATEGORY_OPTIONS}
					title={t("services.table.headers.categories")}
					value={params.deviceCategory}
				/>
				<div className="ml-auto">
					<SortSelect
						onChange={(sort) => refine({ sort })}
						value={params.sort}
					/>
				</div>
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
					onRowClick={handleRowClick}
					table={table}
				/>
			)}
		</div>
	);
}

/** Stable empty page, so the rows memo doesn't rerun while loading. */
const EMPTY: never[] = [];
