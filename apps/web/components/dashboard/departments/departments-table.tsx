"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { useRouter } from "next/navigation";
import { useSubdomain } from "@/components/dashboard/customers/store";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import { SortSelect } from "@/components/dashboard/parts/table/catalog-filters";
import { TableToolbar } from "@/components/dashboard/parts/table/toolbar";
import {
	useCatalogParams,
	useCatalogTable,
	useOutOfRangePage,
	useSearchInput,
} from "@/components/dashboard/parts/table/use-catalog-table";
import { Reveal } from "@/components/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import { SAMPLE_DEPARTMENTS } from "@/lib/samples";
import { cn } from "@/lib/utils";
import { useDepartmentColumns } from "./columns";
import { useDepartmentsPage } from "./store";

const departmentFilters = {};

/** The company's departments, searched by name; a row opens the department. */
export function DepartmentsTable() {
	const { t } = useTranslation();
	const router = useRouter();
	const subdomain = useSubdomain();
	const ability = useCatalogAbility();
	const columns = useDepartmentColumns();
	const { params, refine, setPagination, reset } =
		useCatalogParams(departmentFilters);
	const search = useSearchInput(params.q, (q) => refine({ q }));

	const query = useDepartmentsPage({
		page: params.page,
		perPage: params.perPage,
		query: params.q,
		sort: params.sort,
	});
	useOutOfRangePage(query, params, setPagination);

	const table = useCatalogTable({
		data: query.isPending ? SAMPLE_DEPARTMENTS : (query.data?.records ?? []),
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
				canCreate={ability.can(permissions.departments.create)}
				createHref="/departments/new"
				createLabel={t("departments.table.create")}
				onClear={reset}
				onSearchChange={search.setInput}
				placeholder={t("departments.table.search")}
				search={search.input}
			>
				<SortSelect onChange={(sort) => refine({ sort })} value={params.sort} />
				<DataTableViewOptions align="end" table={table} />
			</TableToolbar>
			<Reveal id="departments-table" loading={query.isPending}>
				<DataTable
					aria-busy={query.isPlaceholderData}
					className={cn(
						"w-full transition-opacity",
						query.isPlaceholderData && "opacity-60"
					)}
					onRowClick={(row) =>
						router.push(
							`/dashboard/${subdomain}/departments/${row.original.id}`
						)
					}
					table={table}
				/>
			</Reveal>
		</div>
	);
}
