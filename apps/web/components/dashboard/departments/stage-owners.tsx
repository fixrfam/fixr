"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import { toast } from "@pheralb/toast";
import { ChevronRight } from "lucide-react";
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
import { cn } from "@/lib/utils";
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
/**
 * The header and every row are subgrids of one grid, so the stage column is as
 * wide as the longest badge and the department column lines up on all rows.
 */
const ROW = "md:col-span-3 md:grid-cols-subgrid";

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

/**
 * Stretches from the stage badge to its department select. Solid when the
 * stage sends the order somewhere, dashed when it keeps it where it is.
 */
function StageConnector({ active }: { active: boolean }) {
	return (
		<span
			aria-hidden
			className={cn(
				"hidden min-w-8 flex-1 items-center md:flex",
				active ? "text-muted-foreground" : "text-muted-foreground/40"
			)}
		>
			<span
				className={cn(
					"flex-1 border-current border-t-2",
					!active && "border-dashed"
				)}
			/>
			<ChevronRight className="-ml-2.5 size-4 shrink-0" strokeWidth={2.5} />
		</span>
	);
}

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
		<div
			className={cn(
				"grid gap-3 border-b py-3 last:border-0 md:items-start",
				ROW
			)}
		>
			<div className="flex h-9 items-center gap-2">
				<ServiceOrderStatusBadge className="shrink-0" variant={status}>
					{t(serviceOrderStatusKeys[status])}
				</ServiceOrderStatusBadge>
				<StageConnector active={Boolean(owner)} />
			</div>
			<div className="grid gap-1.5">
				<span className="text-muted-foreground text-xs md:hidden">
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
				<span className="text-muted-foreground text-xs md:hidden">
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
								{/* Only the label: the hint makes the trigger two lines tall. */}
								<SelectValue>
									{t(MODE_KEYS[owner.assigneeMode].label)}
								</SelectValue>
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
					<p className="flex h-9 items-center px-3 text-muted-foreground text-xs">
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
		<div className="md:grid md:grid-cols-[max-content_minmax(0,1fr)_minmax(0,1fr)] md:gap-x-4">
			<div
				aria-hidden
				className={cn(
					"hidden border-b pb-2 font-medium text-muted-foreground text-xs md:grid",
					ROW
				)}
			>
				{/* Same left padding as the badge and the selects' text below. */}
				<span className="px-2">{t("departments.stages.stage")}</span>
				<span className="px-3">{t("departments.stages.department")}</span>
				<span className="px-3">{t("departments.stages.assignee")}</span>
			</div>
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
