"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { toast } from "@pheralb/toast";
import { Check, Loader2, Network } from "lucide-react";
import { useState } from "react";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";
import { cn } from "@/lib/utils";
import { useDepartmentOptions, useSetEmployeeDepartments } from "./store";

interface EmployeeDepartmentsProps {
	employee: { id: string; name: string };
	departments: { id: string; name: string }[];
}

function DepartmentsChooser({
	employee,
	departments,
	onDone,
}: EmployeeDepartmentsProps & { onDone: () => void }) {
	const { t } = useTranslation();
	const { data: options } = useDepartmentOptions();
	const save = useSetEmployeeDepartments();
	const toastError = useApiErrorToast();
	const [chosen, setChosen] = useState(
		() => new Set(departments.map((department) => department.id))
	);

	function toggle(id: string) {
		setChosen((current) => {
			const next = new Set(current);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}

	async function submit() {
		try {
			await save.mutateAsync({
				employeeId: employee.id,
				departmentIds: [...chosen],
			});
			toast.success({
				text: t("departments.employee.saved", { name: employee.name }),
			});
			onDone();
		} catch (error) {
			toastError(error);
		}
	}

	return (
		<div className="grid gap-4">
			{options.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					{t("departments.employee.noDepartments")}
				</p>
			) : (
				<div className="grid gap-2 sm:grid-cols-2">
					{options.map((department) => {
						const on = chosen.has(department.id);
						return (
							<button
								aria-pressed={on}
								className={cn(
									"flex items-center justify-between gap-2 rounded-md border p-3 text-left text-sm transition-colors",
									on ? "border-primary bg-primary/10" : "hover:bg-muted/50"
								)}
								key={department.id}
								onClick={() => toggle(department.id)}
								type="button"
							>
								<span className="truncate">{department.name}</span>
								<Check
									className={cn("size-4 text-primary", !on && "invisible")}
								/>
							</button>
						);
					})}
				</div>
			)}
			<Button
				disabled={save.isPending}
				onClick={submit}
				size="lg"
				type="button"
			>
				{t("departments.employee.submit")}
				{save.isPending ? <Loader2 className="animate-spin" /> : <Network />}
			</Button>
		</div>
	);
}

/**
 * The employee's departments as badges and, for whoever manages departments,
 * a button that opens a dialog to set them (an employee can be in several).
 */
export function EmployeeDepartments(props: EmployeeDepartmentsProps) {
	const { t } = useTranslation();
	const canEdit = useCatalogAbility().can(permissions.departments.update);
	const [open, setOpen] = useState(false);

	return (
		<div className="flex flex-wrap items-center gap-1">
			{props.departments.length === 0 ? (
				<span className="text-muted-foreground text-xs">
					{t("departments.employee.none")}
				</span>
			) : (
				props.departments.map((department) => (
					<Badge key={department.id} variant="outline">
						{department.name}
					</Badge>
				))
			)}
			{canEdit && (
				<ResponsiveDialogDrawer
					className="max-w-lg!"
					description={t("departments.employee.description", {
						name: props.employee.name,
					})}
					icon={<Network />}
					onOpenChange={setOpen}
					open={open}
					title={t("departments.employee.title")}
					trigger={
						<Button
							aria-label={t("departments.employee.title")}
							className="h-6 px-2 text-xs"
							size="sm"
							type="button"
							variant="ghost"
						>
							<Network className="size-3" />
							{t("departments.employee.assign")}
						</Button>
					}
				>
					{open && (
						<DepartmentsChooser {...props} onDone={() => setOpen(false)} />
					)}
				</ResponsiveDialogDrawer>
			)}
		</div>
	);
}
