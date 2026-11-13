"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import { toast } from "@pheralb/toast";
import { useEffect, useState } from "react";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { serviceOrderStatusKeys } from "@/lib/i18n/labels";
import type { StageOwner } from "@/lib/services/sectors";
import { ServiceOrderStatusBadge } from "../service-order/service-order-status-badge";
import {
	useEmployeeOptions,
	usePutStageOwners,
	useSectors,
	useStageOwners,
} from "./store";

const STATUSES = serviceOrderStatuses.options;
const NONE = "none";

function toDraft(owners: StageOwner[]) {
	return STATUSES.map(
		(status) =>
			owners.find((owner) => owner.status === status) ?? {
				status,
				sectorId: null,
				employeeId: null,
			}
	);
}

/**
 * Who gets an order when it enters each stage: a sector's pool and,
 * optionally, one employee. Each change saves right away, like moving an
 * employee to a sector does.
 */
export function StageOwners() {
	const { t } = useTranslation();
	const canEdit = useCatalogAbility().can(permissions.sectors.update);
	const { data: owners, isPending } = useStageOwners();
	const { data: sectors = [] } = useSectors();
	const { data: employees = [] } = useEmployeeOptions();
	const save = usePutStageOwners();
	const toastError = useApiErrorToast();
	const [draft, setDraft] = useState<StageOwner[]>(() => toDraft([]));

	useEffect(() => {
		setDraft(toDraft(owners ?? []));
	}, [owners]);

	async function update(
		status: StageOwner["status"],
		change: Partial<StageOwner>
	) {
		const stages = draft.map((stage) =>
			stage.status === status ? { ...stage, ...change } : stage
		);
		setDraft(stages);
		try {
			await save.mutateAsync({ stages });
			toast.success({ text: t("sectors.stages.saved") });
		} catch (error) {
			setDraft(toDraft(owners ?? []));
			toastError(error);
		}
	}

	if (isPending) {
		return <Skeleton className="h-64 w-full rounded-md" />;
	}

	return (
		<div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-3 gap-y-2 text-sm">
			<span className="text-muted-foreground text-xs">
				{t("sectors.stages.stage")}
			</span>
			<span className="text-muted-foreground text-xs">
				{t("sectors.stages.sector")}
			</span>
			<span className="text-muted-foreground text-xs">
				{t("sectors.stages.employee")}
			</span>
			{draft.map((stage) => (
				<div className="contents" key={stage.status}>
					<ServiceOrderStatusBadge variant={stage.status}>
						{t(serviceOrderStatusKeys[stage.status])}
					</ServiceOrderStatusBadge>
					<Select
						disabled={!canEdit || save.isPending}
						onValueChange={(value) =>
							update(stage.status, {
								sectorId: value === NONE ? null : value,
								// An employee of another sector can't stay on the stage.
								employeeId: employees.some(
									(employee) =>
										employee.id === stage.employeeId &&
										(value === NONE || employee.sectorId === value)
								)
									? stage.employeeId
									: null,
							})
						}
						value={stage.sectorId ?? NONE}
					>
						<SelectTrigger
							aria-label={t("sectors.stages.sector")}
							className="w-full"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={NONE}>
								{t("sectors.stages.noSector")}
							</SelectItem>
							{sectors.map((sector) => (
								<SelectItem key={sector.id} value={sector.id}>
									{sector.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						disabled={!canEdit || save.isPending}
						onValueChange={(value) =>
							update(stage.status, {
								employeeId: value === NONE ? null : value,
							})
						}
						value={stage.employeeId ?? NONE}
					>
						<SelectTrigger
							aria-label={t("sectors.stages.employee")}
							className="w-full"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={NONE}>
								{t("sectors.stages.noEmployee")}
							</SelectItem>
							{employees
								.filter(
									(employee) =>
										!stage.sectorId || employee.sectorId === stage.sectorId
								)
								.map((employee) => (
									<SelectItem key={employee.id} value={employee.id}>
										{employee.name}
									</SelectItem>
								))}
						</SelectContent>
					</Select>
				</div>
			))}
		</div>
	);
}
