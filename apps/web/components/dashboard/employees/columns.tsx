"use client";

import { roleLabels } from "@fixr/constants/roles";
import { employeeSelectSchema } from "@fixr/db/schema";
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

export const columns: ColumnDef<z.infer<typeof dataSchema>>[] = [
	{
		accessorKey: "name",
		header: "Funcionário",
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
							Ver perfil <ArrowRight className="ml-0.5 size-3" />
						</p>
					</div>
				</div>
			);
		},
	},
	{
		accessorKey: "role",
		header: "Cargo",
		cell: ({ row }) => {
			return (
				<div className="inline-flex items-center gap-2">
					<div className="rounded-md bg-primary/30 p-1 text-primary">
						<BriefcaseBusiness className="size-4" />
					</div>
					{roleLabels[row.original.role]}
				</div>
			);
		},
	},
	{
		accessorKey: "account.email",
		header: "Email",
	},
	{
		accessorKey: "cpf",
		header: "CPF",
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
		header: "Cadastrado em",
		cell: ({ row }) => {
			const date = new Intl.DateTimeFormat("pt-BR", {
				year: "numeric",
				month: "long",
				day: "numeric",
			}).format(new Date(row.original.createdAt));

			return date;
		},
	},
	{
		id: "actions",
		header: "Ações",
		cell: () => {
			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button className="h-8 w-8 p-0" variant="ghost">
							<span className="sr-only">Abrir menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Ações</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							<PencilLine />
							Editar
						</DropdownMenuItem>
						<DropdownMenuItem className="text-destructive">
							<Trash2 /> Excluir
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
