"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import { toast } from "@pheralb/toast";
import { ArrowRight } from "lucide-react";
import { EmployeePicker } from "@/components/dashboard/employees/employee-picker";
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
import type { StageAssigneeMode, StageOwner } from "@/lib/services/departments";
import type { ServiceOrderStatus } from "@/lib/services/service-orders";
import { ServiceOrderStatusBadge } from "../service-order/service-order-status-badge";
import {
	useDepartment,
	useDepartmentOptions,
	usePutStageOwners,
	useStageOwners,
} from "./store";

const STATUSES = serviceOrderStatuses.options;
const MODES: readonly StageAssigneeMode[] = ["pool", "leader", "employee"];
const NONE = "none";

const MODE_KEYS = {
	pool: {
		label: "departments.stages.modes.pool",
		hint: "departments.stages.modes.poolHint",
	},
	leader: {
		label: "departments.stages.modes.leader",
		hint: "departments.stages.modes.leaderHint",
	},
	employee: {
		label: "departments.stages.modes.employee",
		hint: "departments.stages.modes.employeeHint",
	},
} as const;

function StageRow({
	status,
	owner,
	canEdit,
	saving,
	onChange,
}: {
	status: ServiceOrderStatus;
	owner: StageOwner | undefined;
	canEdit: boolean;
	saving: boolean;
	onChange: (owner: StageOwner | null) => void;
}) {
	const { t } = useTranslation();
	const { data: departments } = useDepartmentOptions();
	const { data: department } = useDepartment(owner?.departmentId ?? "");
	const disabled = !canEdit || saving;
	const employee =
		department?.members.find((member) => member.id === owner?.employeeId) ??
		null;

	return (
		<div className="grid gap-3 border-b py-4 last:border-0 md:grid-cols-[10rem_auto_1fr_1fr] md:items-start">
			<ServiceOrderStatusBadge className="mt-2 w-fit" variant={status}>
				{t(serviceOrderStatusKeys[status])}
			</ServiceOrderStatusBadge>
			<ArrowRight className="mt-2.5 hidden size-4 text-muted-foreground md:block" />
			<div className="grid gap-1.5">
				<span className="text-muted-foreground text-xs">
					{t("departments.stages.department")}
				</span>
				<Select
					disabled={disabled}
					onValueChange={(value) =>
						onChange(
							value === NONE
								? null
								: {
										status,
										departmentId: value,
										// Another department: its own pool until someone is picked.
										assigneeMode:
											owner?.assigneeMode === "employee"
												? "pool"
												: (owner?.assigneeMode ?? "pool"),
										employeeId: null,
									}
						)
					}
					value={owner?.departmentId ?? NONE}
				>
					<SelectTrigger
						aria-label={t("departments.stages.department")}
						className="w-full"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={NONE}>{t("departments.stages.keep")}</SelectItem>
						{departments.map((option) => (
							<SelectItem key={option.id} value={option.id}>
								{option.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="grid gap-1.5">
				<span className="text-muted-foreground text-xs">
					{t("departments.stages.assignee")}
				</span>
				{owner ? (
					<>
						<Select
							disabled={disabled}
							onValueChange={(value) =>
								onChange({
									...owner,
									assigneeMode: value as StageAssigneeMode,
									employeeId: null,
								})
							}
							value={owner.assigneeMode}
						>
							<SelectTrigger
								aria-label={t("departments.stages.assignee")}
								className="w-full"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{MODES.map((mode) => (
									<SelectItem key={mode} value={mode}>
										<span className="grid text-left">
											<span>{t(MODE_KEYS[mode].label)}</span>
											<span className="text-muted-foreground text-xs">
												{t(MODE_KEYS[mode].hint)}
											</span>
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{owner.assigneeMode === "leader" && !department?.leader && (
							<p className="text-muted-foreground text-xs">
								{t("departments.stages.noLeaderYet")}
							</p>
						)}
						{owner.assigneeMode === "employee" && (
							<EmployeePicker
								disabled={disabled}
								onChange={(picked) =>
									onChange({ ...owner, employeeId: picked.id })
								}
								only={department?.members.map((member) => member.id) ?? []}
								placeholder={t("departments.stages.pickEmployee")}
								value={employee}
							/>
						)}
					</>
				) : (
					<p className="pt-2 text-muted-foreground text-xs">
						{t("departments.stages.keepHint")}
					</p>
				)}
			</div>
		</div>
	);
}

/**
 * Which department receives a service order when it enters each stage, and
 * who inside it. Each change saves right away.
 */
export function StageOwners() {
	const { t } = useTranslation();
	const canEdit = useCatalogAbility().can(permissions.departments.update);
	const { data: owners, isPending } = useStageOwners();
	const save = usePutStageOwners();
	const toastError = useApiErrorToast();

	async function change(status: ServiceOrderStatus, owner: StageOwner | null) {
		// An employee-mode stage waits for its employee before saving.
		if (owner?.assigneeMode === "employee" && !owner.employeeId) {
			return;
		}
		const stages = [
			...(owners ?? []).filter((stage) => stage.status !== status),
			...(owner ? [owner] : []),
		];
		try {
			await save.mutateAsync({ stages });
			toast.success({ text: t("departments.stages.saved") });
		} catch (error) {
			toastError(error);
		}
	}

	if (isPending) {
		return <Skeleton className="h-64 w-full rounded-md" />;
	}

	return (
		<div>
			{STATUSES.map((status) => (
				<StageRow
					canEdit={canEdit}
					key={status}
					onChange={(owner) => change(status, owner)}
					owner={owners?.find((stage) => stage.status === status)}
					saving={save.isPending}
					status={status}
				/>
			))}
		</div>
	);
}
