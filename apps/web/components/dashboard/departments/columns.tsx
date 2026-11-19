"use client";

import { useTranslation } from "@fixr/i18n/react";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { EmployeeChip } from "@/components/dashboard/employees/employee-chip";
import type { DepartmentRow } from "@/lib/services/departments";

const columnHelper = createColumnHelper<DepartmentRow>();

export function useDepartmentColumns(): ColumnDef<DepartmentRow>[] {
	const { t, format } = useTranslation();

	return useMemo(
		() => [
			columnHelper.accessor("name", {
				header: t("departments.table.headers.name"),
				cell: ({ getValue }) => (
					<span className="font-medium">{getValue()}</span>
				),
				meta: { label: t("departments.table.headers.name") },
			}),
			columnHelper.display({
				id: "leader",
				header: t("departments.table.headers.leader"),
				cell: ({ row }) =>
					row.original.leader ? (
						<EmployeeChip employee={row.original.leader} />
					) : (
						<span className="text-muted-foreground text-xs">
							{t("departments.table.noLeader")}
						</span>
					),
				meta: { label: t("departments.table.headers.leader") },
			}),
			columnHelper.accessor("membersCount", {
				header: t("departments.table.headers.members"),
				cell: ({ getValue }) => (
					<span className="tabular-nums">
						{t("departments.table.membersCount", { count: getValue() })}
					</span>
				),
				meta: { label: t("departments.table.headers.members") },
			}),
			columnHelper.accessor("createdAt", {
				header: t("departments.table.headers.createdAt"),
				cell: ({ getValue }) => (
					<span className="text-xs">{format.date(getValue())}</span>
				),
				meta: { label: t("departments.table.headers.createdAt") },
			}),
		],
		[t, format]
	) as ColumnDef<DepartmentRow>[];
}
