"use client";

import { useTranslation } from "@fixr/i18n/react";
import { estimateStatuses } from "@fixr/schemas/estimates";
import { useParams, useRouter } from "next/navigation";
import { parseAsString, parseAsStringLiteral } from "nuqs";
import {
	useCatalogParams,
	useCatalogTable,
	useOutOfRangePage,
	useSearchInput,
} from "@/components/dashboard/parts/table/use-catalog-table";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useEstimatesPage } from "../store";
import { useEstimateColumns } from "./columns";
import { CustomerFilter } from "./customer-filter";

const ALL = "all";
const STATUSES = estimateStatuses.options;
const estimateFilters = {
	status: parseAsStringLiteral(STATUSES),
	clientId: parseAsString,
};

/**
 * The company's estimates, newest first: searched by number or client,
 * filtered by status and client. A row opens the estimate.
 */
export function EstimatesTable() {
	const { t } = useTranslation();
	const router = useRouter();
	const { subdomain } = useParams<{ subdomain: string }>();
	const columns = useEstimateColumns(subdomain);
	const { params, refine, setPagination, reset } =
		useCatalogParams(estimateFilters);
	const search = useSearchInput(params.q, (q) => refine({ q }));

	const query = useEstimatesPage({
		page: params.page,
		perPage: params.perPage,
		query: params.q || undefined,
		status: params.status ?? undefined,
		clientId: params.clientId ?? undefined,
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
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex w-full flex-wrap items-center gap-3">
					<Input
						aria-label={t("estimates.table.search")}
						className="max-w-sm"
						onChange={(e) => search.setInput(e.target.value)}
						placeholder={t("estimates.table.search")}
						value={search.input}
					/>
					<CustomerFilter
						onChange={(clientId) => refine({ clientId })}
						value={params.clientId}
					/>
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
							aria-label={t("estimates.table.headers.status")}
							className="w-auto"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>
								{t("estimates.table.allStatuses")}
							</SelectItem>
							{STATUSES.map((status) => (
								<SelectItem key={status} value={status}>
									{t(`estimates.status.${status}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button onClick={reset} variant="ghost">
						{t("common.actions.clear")}
					</Button>
				</div>
				<DataTableViewOptions align="end" table={table} />
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
					onRowClick={(row) =>
						router.push(`/dashboard/${subdomain}/estimates/${row.original.id}`)
					}
					table={table}
				/>
			)}
		</div>
	);
}
