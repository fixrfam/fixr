"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { toast } from "@pheralb/toast";
import { ArrowRight, Loader2, UserRoundCog } from "lucide-react";
import { useState } from "react";
import { useDepartmentOptions } from "@/components/dashboard/departments/store";
import { EmployeeChip } from "@/components/dashboard/employees/employee-chip";
import { EmployeePicker } from "@/components/dashboard/employees/employee-picker";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Person } from "@/lib/services/departments";
import type { ServiceOrderDetail } from "@/lib/services/service-orders";
import { useAssignServiceOrder } from "../store";
import {
	ServiceOrderKeyValueItem,
	ServiceOrderKeyValueList,
} from "./service-order-key-value";

const NONE = "none";

type Picked = Person & { departments?: { id: string; name: string }[] };

function ReassignForm({
	order,
	onDone,
}: {
	order: ServiceOrderDetail;
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const assign = useAssignServiceOrder(order.id);
	const toastError = useApiErrorToast();
	const { data: departments } = useDepartmentOptions();
	const [departmentId, setDepartmentId] = useState(order.departmentId);
	const [assignee, setAssignee] = useState<Picked | null>(order.assignee);

	// The employee's departments when the picked one isn't among them (decision A).
	const inPicked = assignee?.departments?.some((d) => d.id === departmentId);
	const choices =
		assignee?.departments && departmentId && !inPicked
			? assignee.departments
			: null;

	const unchanged =
		departmentId === order.departmentId &&
		(assignee?.id ?? null) === order.assigneeId;
	const needsDepartment = Boolean(choices && choices.length > 0);

	function pickAssignee(employee: Picked) {
		setAssignee(employee);
		const own = employee.departments ?? [];
		// Stays in the order's department when they're in it; otherwise their only one.
		if (!(departmentId && own.some((d) => d.id === departmentId))) {
			if (own.length === 1) {
				setDepartmentId(own[0]!.id);
			} else if (own.length === 0) {
				setDepartmentId(null);
			}
		}
	}

	async function submit() {
		try {
			await assign.mutateAsync({
				departmentId,
				assigneeId: assignee?.id ?? null,
			});
			toast.success({ text: t("serviceOrders.assignment.changed") });
			onDone();
		} catch (error) {
			toastError(error);
		}
	}

	return (
		<form
			className="grid gap-4"
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<div className="grid gap-2">
				<Label htmlFor="assign-department">
					{t("serviceOrders.assignment.department")}
				</Label>
				<Select
					onValueChange={(value) =>
						setDepartmentId(value === NONE ? null : value)
					}
					value={departmentId ?? NONE}
				>
					<SelectTrigger className="w-full" id="assign-department">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={NONE}>
							{t("serviceOrders.assignment.noDepartment")}
						</SelectItem>
						{(needsDepartment ? choices! : departments).map((department) => (
							<SelectItem key={department.id} value={department.id}>
								{department.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{needsDepartment && assignee && (
					<p
						className="text-amber-700 text-xs dark:text-amber-300"
						role="alert"
					>
						{t("serviceOrders.assignment.pickTheirDepartment", {
							name: assignee.name,
						})}
					</p>
				)}
			</div>
			<div className="grid gap-2">
				<Label htmlFor="assign-employee">
					{t("serviceOrders.assignment.assignee")}
				</Label>
				<EmployeePicker
					id="assign-employee"
					onChange={pickAssignee}
					placeholder={t("serviceOrders.assignment.noAssignee")}
					value={assignee}
				/>
				{assignee && (
					<Button
						className="w-fit"
						onClick={() => setAssignee(null)}
						size="sm"
						type="button"
						variant="ghost"
					>
						{t("serviceOrders.assignment.backToPool")}
					</Button>
				)}
			</div>
			<Button
				className="w-full"
				disabled={unchanged || needsDepartment || assign.isPending}
				size="lg"
				type="submit"
			>
				{unchanged
					? t("serviceOrders.assignment.sameAsNow")
					: t("serviceOrders.assignment.submit")}
				{assign.isPending ? (
					<Loader2 className="animate-spin" />
				) : (
					<UserRoundCog />
				)}
			</Button>
		</form>
	);
}

/** The reassign button; nothing without `serviceOrders:assign`. */
export function ReassignDialog({
	order,
	compact = false,
}: {
	order: ServiceOrderDetail;
	/** A small ghost button, for a card header. */
	compact?: boolean;
}) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const canAssign = useCatalogAbility().can(permissions.serviceOrders.assign);

	if (!canAssign) {
		return null;
	}

	return (
		<ResponsiveDialogDrawer
			className="max-w-md!"
			description={t("serviceOrders.assignment.reassignDescription")}
			icon={<UserRoundCog />}
			onOpenChange={setOpen}
			open={open}
			title={t("serviceOrders.assignment.reassignTitle")}
			trigger={
				<Button
					size={compact ? "sm" : "default"}
					type="button"
					variant={compact ? "ghost" : "outline"}
				>
					<UserRoundCog className="size-3.5" />
					{t("serviceOrders.assignment.reassign")}
				</Button>
			}
		>
			{open && <ReassignForm onDone={() => setOpen(false)} order={order} />}
		</ResponsiveDialogDrawer>
	);
}

/**
 * Who has the order (department and employee), who opened it, and every
 * reassignment. Reassigning lives in the card header ({@link ReassignDialog}).
 */
export function ServiceOrderAssignment({
	order,
}: {
	order: ServiceOrderDetail;
}) {
	const { t, format } = useTranslation();
	const history = [...order.assignments].reverse();

	return (
		<div className="space-y-4">
			<ServiceOrderKeyValueList>
				<ServiceOrderKeyValueItem
					label={t("serviceOrders.assignment.department")}
					value={
						order.department?.name ?? t("serviceOrders.assignment.noDepartment")
					}
				/>
				<ServiceOrderKeyValueItem
					label={t("serviceOrders.assignment.assignee")}
					value={
						order.assignee ? (
							<EmployeeChip employee={order.assignee} size="sm" />
						) : (
							t("serviceOrders.assignment.noAssignee")
						)
					}
				/>
				<ServiceOrderKeyValueItem
					label={t("serviceOrders.assignment.openedBy")}
					value={order.employee.name}
				/>
			</ServiceOrderKeyValueList>

			<div className="space-y-2">
				<p className="font-medium text-xs">
					{t("serviceOrders.assignment.history")}
				</p>
				{history.length === 0 ? (
					<p className="text-muted-foreground text-xs">
						{t("serviceOrders.assignment.noHistory")}
					</p>
				) : (
					<ol className="space-y-2">
						{history.map((entry) => (
							<li className="grid gap-0.5 text-xs" key={entry.id}>
								<span className="flex flex-wrap items-center gap-1">
									{[entry.fromDepartment?.name, entry.fromAssignee?.name]
										.filter(Boolean)
										.join(" · ") || t("serviceOrders.assignment.nobody")}
									<ArrowRight className="size-3 text-muted-foreground" />
									<span className="font-medium">
										{[entry.toDepartment?.name, entry.toAssignee?.name]
											.filter(Boolean)
											.join(" · ") || t("serviceOrders.assignment.nobody")}
									</span>
								</span>
								<span className="text-muted-foreground">
									{format.dateTime(entry.createdAt)} ·{" "}
									{entry.employee
										? t("serviceOrders.assignment.by", {
												name: entry.employee.name,
											})
										: t("serviceOrders.assignment.byStage")}
								</span>
							</li>
						))}
					</ol>
				)}
			</div>
		</div>
	);
}
