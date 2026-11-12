"use client";

import { useTranslation } from "@fixr/i18n/react";
import { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral } from "nuqs";
import {
	useCatalogParams,
	useCatalogTable,
	useOutOfRangePage,
	useSearchInput,
} from "@/components/dashboard/parts/table/use-catalog-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { serviceOrderStatusKeys } from "@/lib/i18n/labels";
import { cn } from "@/lib/utils";
import { useServiceOrdersPage } from "../store";
import { useColumns } from "./columns";
import { TableToolbar } from "./toolbar";

const ALL = "all";
const STATUSES = serviceOrderStatuses.options;
const orderFilters = { status: parseAsStringLiteral(STATUSES) };

interface Props {
	subdomain: string;
}

/** The company's service orders, newest first, searched and filtered by the API. */
export function ServiceOrdersTable({ subdomain }: Props) {
	const { t } = useTranslation();
	const router = useRouter();
	const columns = useColumns(subdomain);
	const { params, refine, setPagination, reset } =
		useCatalogParams(orderFilters);
	const search = useSearchInput(params.q, (q) => refine({ q }));

	const query = useServiceOrdersPage({
		page: params.page,
		perPage: params.perPage,
		query: params.q,
		status: params.status ?? undefined,
		sort: "newer",
	});
	useOutOfRangePage(query, params, setPagination);

	const table = useCatalogTable({
		data: query.data?.records ?? [],
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
				onClear={reset}
				onSearchChange={search.setInput}
				search={search.input}
			>
				<Select
					onValueChange={(value) =>
						refine({
							status:
								value === ALL ? null : (value as (typeof STATUSES)[number]),
						})
					}
					value={params.status ?? ALL}
				>
					<SelectTrigger
						aria-label={t("serviceOrders.table.columns.status")}
						className="w-auto"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>
							{t("devices.table.allStatuses")}
						</SelectItem>
						{STATUSES.map((status) => (
							<SelectItem key={status} value={status}>
								{t(serviceOrderStatusKeys[status])}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<DataTableViewOptions align="end" table={table} />
			</TableToolbar>
			{query.isPending ? (
				<Skeleton className="h-96 w-full rounded-md" />
			) : (
				<DataTable
					aria-busy={query.isPlaceholderData}
					className={cn(
						"w-full transition-opacity",
						query.isPlaceholderData && "opacity-60"
					)}
					onRowClick={(row) =>
						router.push(
							`/dashboard/${subdomain}/service-orders/${row.original.id}`
						)
					}
					table={table}
				/>
			)}
		</div>
	);
}
