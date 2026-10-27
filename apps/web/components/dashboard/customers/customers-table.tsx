"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { CopyableValue } from "@/components/dashboard/copyable-value";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import { SortSelect } from "@/components/dashboard/parts/table/catalog-filters";
import { TableToolbar } from "@/components/dashboard/parts/table/toolbar";
import {
	useCatalogParams,
	useCatalogTable,
	useOutOfRangePage,
	useSearchInput,
} from "@/components/dashboard/parts/table/use-catalog-table";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCpf, formatPhone } from "@/lib/format";
import type { CustomerRow } from "@/lib/services/customers";
import { cn } from "@/lib/utils";
import { CustomerAvatar } from "./customer-avatar";
import { useCustomersPage, useSubdomain } from "./store";

const customerFilters = {};
const columnHelper = createColumnHelper<CustomerRow>();
const CPF_LIKE = /^[\d.\s-]+$/;

function useCustomerColumns() {
	const { t } = useTranslation();

	return useMemo(
		() => [
			columnHelper.accessor("name", {
				header: t("customers.table.headers.name"),
				cell: ({ row }) => (
					<div className="flex items-center gap-2.5">
						<CustomerAvatar customer={row.original} />
						<span className="font-medium">{row.original.name}</span>
					</div>
				),
				meta: { label: t("customers.table.headers.name") },
			}),
			columnHelper.accessor("cpf", {
				header: t("customers.table.headers.cpf"),
				cell: ({ getValue }) => (
					<CopyableValue
						label={t("customers.table.headers.cpf")}
						value={formatCpf(getValue())}
					/>
				),
				meta: { label: t("customers.table.headers.cpf") },
			}),
			columnHelper.accessor("phone", {
				header: t("customers.table.headers.phone"),
				cell: ({ getValue }) => (
					<CopyableValue
						label={t("customers.table.headers.phone")}
						value={formatPhone(getValue())}
					/>
				),
				meta: { label: t("customers.table.headers.phone") },
			}),
			columnHelper.accessor("email", {
				header: t("customers.table.headers.email"),
				cell: ({ getValue }) => (
					<CopyableValue
						className="text-2xs"
						label={t("customers.table.headers.email")}
						value={getValue() ?? ""}
					/>
				),
				meta: { label: t("customers.table.headers.email") },
			}),
			columnHelper.accessor(
				(row) => [row.city, row.state].filter(Boolean).join(" / "),
				{
					id: "city",
					header: t("customers.table.headers.city"),
					meta: { label: t("customers.table.headers.city") },
				}
			),
		],
		[t]
	) as ColumnDef<CustomerRow>[];
}

export function CustomersTable() {
	const { t } = useTranslation();
	const router = useRouter();
	const subdomain = useSubdomain();
	const ability = useCatalogAbility();
	const columns = useCustomerColumns();
	const { params, refine, setPagination, reset } =
		useCatalogParams(customerFilters);
	const search = useSearchInput(params.q, (q) => refine({ q }));

	const query = useCustomersPage({
		page: params.page,
		perPage: params.perPage,
		// CPFs and phones are stored as digits.
		query: CPF_LIKE.test(params.q) ? params.q.replace(/\D/g, "") : params.q,
		sort: params.sort,
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
				canCreate={ability.can(permissions.customers.create)}
				createHref="/customers/new"
				createLabel={t("customers.table.create")}
				onClear={reset}
				onSearchChange={search.setInput}
				placeholder={t("customers.table.search")}
				search={search.input}
			/>
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
					onRowClick={(row) =>
						router.push(`/dashboard/${subdomain}/customers/${row.original.id}`)
					}
					table={table}
				/>
			)}
		</div>
	);
}
