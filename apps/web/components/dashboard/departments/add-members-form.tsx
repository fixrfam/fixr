"use client";

import { useTranslation } from "@fixr/i18n/react";
import { toast } from "@pheralb/toast";
import { Loader2, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { EmployeeChip } from "@/components/dashboard/employees/employee-chip";
import { EmployeePicker } from "@/components/dashboard/employees/employee-picker";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { Button } from "@/components/ui/button";
import type { Person } from "@/lib/services/departments";
import { useAddDepartmentMembers, useDepartment } from "./store";

/** Pick employees one by one (searching or creating them) and add them all at once. */
export function AddMembersForm({
	departmentId,
	onSuccess,
}: {
	departmentId: string;
	onSuccess?: () => void;
}) {
	const { t } = useTranslation();
	const { data: department } = useDepartment(departmentId);
	const add = useAddDepartmentMembers(departmentId);
	const toastError = useApiErrorToast();
	const [picked, setPicked] = useState<Person[]>([]);
	const memberIds = new Set(department?.members.map((member) => member.id));

	function pick(employee: Person) {
		if (
			memberIds.has(employee.id) ||
			picked.some((p) => p.id === employee.id)
		) {
			return;
		}
		setPicked((current) => [...current, employee]);
	}

	async function submit() {
		try {
			await add.mutateAsync(picked.map((employee) => employee.id));
			toast.success({
				text: t("departments.members.added", { count: picked.length }),
			});
			onSuccess?.();
		} catch (error) {
			toastError(error);
		}
	}

	return (
		<div className="grid gap-4">
			<EmployeePicker
				onChange={pick}
				placeholder={t("departments.members.pickPlaceholder")}
				value={null}
			/>
			{picked.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					{t("departments.members.pickHint")}
				</p>
			) : (
				<ul className="grid gap-2">
					{picked.map((employee) => (
						<li
							className="flex items-center justify-between gap-2 rounded-md border p-2"
							key={employee.id}
						>
							<EmployeeChip employee={employee} />
							<Button
								aria-label={t("common.actions.remove")}
								onClick={() =>
									setPicked((current) =>
										current.filter((p) => p.id !== employee.id)
									)
								}
								size="icon"
								type="button"
								variant="ghost"
							>
								<X className="size-3.5" />
							</Button>
						</li>
					))}
				</ul>
			)}
			<Button
				disabled={picked.length === 0 || add.isPending}
				onClick={submit}
				size="lg"
				type="button"
			>
				{t("departments.members.submit", { count: picked.length })}
				{add.isPending ? <Loader2 className="animate-spin" /> : <UserPlus />}
			</Button>
		</div>
	);
}
