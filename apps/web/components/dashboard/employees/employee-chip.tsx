"use client";

import { Avatar } from "@/components/account/profile-avatar";
import { formatCpf } from "@/lib/format";
import { cn } from "@/lib/utils";

/** An employee's generated avatar, seeded by the id like the customers'. */
export function EmployeeAvatar({
	employee,
	className,
}: {
	employee: { id: string; name: string };
	className?: string;
}) {
	return (
		<Avatar
			aria-hidden
			className={cn("size-8 shrink-0", className)}
			fallbackHash={employee.id}
			fallbackType="beam"
			title={employee.name}
		/>
	);
}

/** Avatar, name and CPF: how an employee shows up in lists and cards. */
export function EmployeeChip({
	employee,
	size = "md",
	className,
}: {
	employee: { id: string; name: string; cpf: string };
	size?: "sm" | "md";
	className?: string;
}) {
	return (
		<span className={cn("flex min-w-0 items-center gap-2", className)}>
			<EmployeeAvatar
				className={size === "sm" ? "size-5" : "size-7"}
				employee={employee}
			/>
			<span className="flex min-w-0 flex-col leading-tight">
				<span className="truncate">{employee.name}</span>
				<span className="text-[0.7rem] text-muted-foreground tabular-nums">
					{formatCpf(employee.cpf)}
				</span>
			</span>
		</span>
	);
}
