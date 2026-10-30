"use client";

import { useTranslation } from "@fixr/i18n/react";
import { toast } from "@pheralb/toast";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployeeOptions, useSectors, useSetEmployeeSector } from "./store";

const NONE = "none";

/** Every employee with a picker for their sector ("my sector"). */
export function SectorMembers() {
	const { t } = useTranslation();
	const { data: employees, isPending } = useEmployeeOptions();
	const { data: sectors = [] } = useSectors();
	const move = useSetEmployeeSector();
	const toastError = useApiErrorToast();

	if (isPending) {
		return <Skeleton className="h-40 w-full rounded-md" />;
	}

	return (
		<ul className="divide-y">
			{employees?.map((employee) => (
				<li
					className="flex items-center justify-between gap-3 py-2"
					key={employee.id}
				>
					<span className="truncate text-sm">{employee.name}</span>
					<Select
						disabled={move.isPending || sectors.length === 0}
						onValueChange={(value) =>
							move
								.mutateAsync({
									employeeId: employee.id,
									sectorId: value === NONE ? null : value,
								})
								.then(() =>
									toast.success({
										text: t("sectors.members.moved", { name: employee.name }),
									})
								)
								.catch(toastError)
						}
						value={employee.sectorId ?? NONE}
					>
						<SelectTrigger
							aria-label={t("sectors.members.sector")}
							className="w-48"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={NONE}>{t("sectors.members.none")}</SelectItem>
							{sectors.map((sector) => (
								<SelectItem key={sector.id} value={sector.id}>
									{sector.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</li>
			))}
		</ul>
	);
}
