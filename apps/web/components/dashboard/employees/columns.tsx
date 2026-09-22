"use client";

import { employeeSelectSchema } from "@fixr/db/schema";
import type { Translator } from "@fixr/i18n";
import { accountSchema } from "@fixr/schemas/account";
import type { ColumnDef } from "@tanstack/react-table";
import {
	ArrowRight,
	BriefcaseBusiness,
	MoreHorizontal,
	PencilLine,
	Trash2,
} from "lucide-react";
import type { z } from "zod";
import { Avatar } from "@/components/account/profile-avatar";
import { roleLabelKeys } from "@/lib/i18n/labels";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const dataSchema = employeeSelectSchema.extend({
	account: accountSchema.pick({
		id: true,
		email: true,
		avatarUrl: true,
		createdAt: true,
	}),
});

const REGEXES = {
	CPF: /(\d{3})(\d{3})(\d{3})(\d{2})/,
};

export function buildColumns({
	t,
	format,
}: {
	t: Translator["t"];
	format: Translator["format"];
}): ColumnDef<z.infer<typeof dataSchema>>[] {
	return [
	{
		accessorKey: "name",
		header: t("employees.table.headers.name"),
		cell: ({ row }) => {
			return (
				<div className="inline-flex items-center gap-3">
					<Avatar
						className="size-9"
						fallbackHash={row.original.account.id as string}
						src={row.original.account.avatarUrl}
					/>
					<div className="flex flex-col">
						<p>{row.original.name}</p>
						<p className="inline-flex cursor-pointer items-center text-muted-foreground text-xs hover:underline">
							{t("employees.table.viewProfile")}{" "}
							<ArrowRight className="ml-0.5 size-3" />
						</p>
					</div>
				</div>
			);
		},
	},
	{
		accessorKey: "role",
		header: t("employees.table.headers.role"),
		cell: ({ row }) => {
			const role = row.original.role as keyof typeof roleLabelKeys;
			return (
				<div className="inline-flex items-center gap-2">
					<div className="rounded-md bg-primary/30 p-1 text-primary">
						<BriefcaseBusiness className="size-4" />
					</div>
					{t(roleLabelKeys[role])}
				</div>
			);
		},
	},
	{
		accessorKey: "account.email",
		header: t("employees.table.headers.email"),
	},
	{
		accessorKey: "cpf",
		header: t("employees.table.headers.document"),
		cell: ({ row }) => {
			return row.original.cpf.replace(REGEXES.CPF, "$1.$2.$3-$4");
		},
	},
	// {
	//     accessorKey: "phone",
	//     header: "Celular",
	// },
	{
		accessorKey: "createdAt",
		header: t("employees.table.headers.createdAt"),
		cell: ({ row }) =>
			format.date(row.original.createdAt, { dateStyle: "long" }),
	},
	{
		id: "actions",
		header: t("employees.table.headers.actions"),
		cell: () => {
			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button className="h-8 w-8 p-0" variant="ghost">
							<span className="sr-only">{t("common.actions.openMenu")}</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>
							{t("employees.table.headers.actions")}
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							<PencilLine />
							{t("common.actions.edit")}
						</DropdownMenuItem>
						<DropdownMenuItem className="text-destructive">
							<Trash2 /> {t("common.actions.delete")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
	];
}
