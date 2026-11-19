"use client";

import { useTranslation } from "@fixr/i18n/react";
import { parseAsString, useQueryState } from "nuqs";
import { useDepartmentOptions } from "@/components/dashboard/departments/store";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const ALL = "all";

/** `?department=<id>`: one department's pool inside the list of every order. */
export function useDepartmentFilter() {
	return useQueryState(
		"department",
		parseAsString.withOptions({ history: "replace" })
	);
}

export function DepartmentFilter() {
	const { t } = useTranslation();
	const [departmentId, setDepartmentId] = useDepartmentFilter();
	const { data: departments } = useDepartmentOptions();

	if (departments.length === 0) {
		return null;
	}

	return (
		<Select
			onValueChange={(value) => setDepartmentId(value === ALL ? null : value)}
			value={departmentId ?? ALL}
		>
			<SelectTrigger
				aria-label={t("serviceOrders.table.columns.department")}
				className="w-auto"
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value={ALL}>
					{t("serviceOrders.pools.allDepartments")}
				</SelectItem>
				{departments.map((department) => (
					<SelectItem key={department.id} value={department.id}>
						{department.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
