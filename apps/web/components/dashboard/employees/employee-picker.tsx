"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { useState } from "react";
import { useEmployeeSearch } from "@/components/dashboard/departments/store";
import { StackedDialog } from "@/components/dashboard/dialog-stack";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { formatCpf } from "@/lib/format";
import type { Person } from "@/lib/services/departments";
import { cn } from "@/lib/utils";
import { EmployeeAvatar } from "./employee-chip";
import { NewEmployeeForm } from "./new/create-employee-form";

/**
 * Search the company's employees by name or CPF and pick one, like the
 * customer picker of a new order. Whoever can register employees also gets a
 * "new employee" button that picks the one they create.
 */
export function EmployeePicker({
	value,
	onChange,
	only,
	placeholder,
	disabled,
	id,
}: {
	value: Person | null;
	onChange: (employee: Person) => void;
	/** Offer only these employees (e.g. a department's members). */
	only?: readonly string[];
	placeholder?: string;
	disabled?: boolean;
	id?: string;
}) {
	const { t } = useTranslation();
	const canCreate = useCatalogAbility().can(permissions.employees.create);
	const [open, setOpen] = useState(false);
	const [creating, setCreating] = useState(false);
	const [search, setSearch] = useState("");
	const { employees, loading } = useEmployeeSearch(search);
	const shown = only
		? employees.filter((employee) => only.includes(employee.id))
		: employees;
	const label = placeholder ?? t("employees.picker.placeholder");

	return (
		<div className="flex items-center gap-2">
			<Popover onOpenChange={setOpen} open={open}>
				<PopoverTrigger asChild>
					<Button
						aria-expanded={open}
						className="min-w-0 flex-1 justify-between font-normal"
						disabled={disabled}
						id={id}
						role="combobox"
						type="button"
						variant="outline"
					>
						<span
							className={cn(
								"flex min-w-0 items-center gap-2",
								!value && "text-muted-foreground"
							)}
						>
							{value && <EmployeeAvatar className="size-5" employee={value} />}
							<span className="truncate">
								{value ? `${value.name} · ${formatCpf(value.cpf)}` : label}
							</span>
						</span>
						<ChevronsUpDown className="size-3.5 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					align="start"
					className="w-(--radix-popover-trigger-width) min-w-72 p-0"
				>
					<Command shouldFilter={false}>
						<CommandInput
							onValueChange={setSearch}
							placeholder={t("employees.picker.search")}
							value={search}
						/>
						<CommandList>
							{!loading && (
								<CommandEmpty>{t("employees.picker.empty")}</CommandEmpty>
							)}
							<CommandGroup>
								{shown.map((employee) => (
									<CommandItem
										key={employee.id}
										onSelect={() => {
											onChange(employee);
											setOpen(false);
										}}
										value={employee.id}
									>
										<Check
											className={cn(
												"size-3.5",
												value?.id === employee.id ? "opacity-100" : "opacity-0"
											)}
										/>
										<EmployeeAvatar className="size-6" employee={employee} />
										<span className="truncate">{employee.name}</span>
										<span className="ml-auto text-muted-foreground text-xs tabular-nums">
											{formatCpf(employee.cpf)}
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			{canCreate && !only && (
				<Button
					className="shrink-0"
					disabled={disabled}
					onClick={() => setCreating(true)}
					type="button"
					variant="outline"
				>
					<UserPlus />
					<span className="max-sm:sr-only">{t("employees.picker.create")}</span>
				</Button>
			)}
			<StackedDialog
				className="sm:max-w-2xl"
				description={t("employees.picker.createHint")}
				icon={<UserPlus />}
				onOpenChange={setCreating}
				open={creating}
				title={t("employees.picker.create")}
			>
				<NewEmployeeForm
					onSuccess={(created) => {
						if (created) {
							onChange(created);
						}
						setCreating(false);
					}}
				/>
			</StackedDialog>
		</div>
	);
}
