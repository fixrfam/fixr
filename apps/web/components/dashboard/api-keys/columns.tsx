"use client";

import { apiKeyPublicSchema } from "@fixr/db/schema";
import type { ColumnDef } from "@tanstack/react-table";
import { Ban, KeyRound, MoreHorizontal } from "lucide-react";
import type { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const dataSchema = apiKeyPublicSchema;

export type ApiKeyRow = z.infer<typeof dataSchema>;

/**
 * A key is usable only while it is neither revoked nor past its expiration.
 *
 * Status is a quiet piece of information next to the key name, so none of the
 * variants use the primary colour. Revoked is the deliberate action and keeps a
 * hint of destructive; expired just happened on its own and stays muted.
 */
export function getKeyStatus(key: ApiKeyRow): {
	label: string;
	variant: "default" | "secondary" | "destructive" | "outline";
	className?: string;
} {
	if (key.revokedAt) {
		return {
			label: "Revogada",
			variant: "outline",
			className: "border-destructive/40 text-destructive",
		};
	}

	if (key.expiresAt && new Date(key.expiresAt) <= new Date()) {
		return {
			label: "Expirada",
			variant: "outline",
			className: "text-muted-foreground",
		};
	}

	return { label: "Ativa", variant: "secondary" };
}

function formatDate(value: Date | string | null) {
	if (!value) {
		return "-";
	}

	return new Intl.DateTimeFormat("pt-BR", {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(new Date(value));
}

export function buildColumns({
	onRevoke,
	canRevoke,
}: {
	onRevoke: (key: ApiKeyRow) => void;
	canRevoke: boolean;
}): ColumnDef<ApiKeyRow>[] {
	return [
		{
			accessorKey: "name",
			header: "Chave",
			cell: ({ row }) => (
				<div className="inline-flex items-center gap-3">
					<div className="rounded-md bg-primary/30 p-1.5 text-primary">
						<KeyRound className="size-4" />
					</div>
					<div className="flex flex-col">
						<p>{row.original.name}</p>
						<code className="text-muted-foreground text-xs">
							fxr_{row.original.prefix}_••••
						</code>
					</div>
				</div>
			),
		},
		{
			id: "status",
			header: "Status",
			cell: ({ row }) => {
				const status = getKeyStatus(row.original);
				return (
					<Badge className={status.className} variant={status.variant}>
						{status.label}
					</Badge>
				);
			},
		},
		{
			accessorKey: "scopes",
			header: "Permissões",
			cell: ({ row }) => {
				const scopes = row.original.scopes ?? [];

				if (scopes.length === 0) {
					return (
						<span className="text-muted-foreground text-sm">
							Herda seu cargo
						</span>
					);
				}

				return (
					<span className="text-sm">
						{scopes.length} {scopes.length === 1 ? "permissão" : "permissões"}
					</span>
				);
			},
		},
		{
			accessorKey: "lastUsedAt",
			header: "Último uso",
			cell: ({ row }) =>
				row.original.lastUsedAt ? (
					formatDate(row.original.lastUsedAt)
				) : (
					<span className="text-muted-foreground">Nunca usada</span>
				),
		},
		{
			accessorKey: "expiresAt",
			header: "Expira em",
			cell: ({ row }) =>
				row.original.expiresAt ? (
					formatDate(row.original.expiresAt)
				) : (
					<span className="text-muted-foreground">Sem expiração</span>
				),
		},
		{
			accessorKey: "createdAt",
			header: "Criada em",
			cell: ({ row }) => formatDate(row.original.createdAt),
		},
		{
			id: "actions",
			header: "Ações",
			cell: ({ row }) => {
				const isRevoked = Boolean(row.original.revokedAt);

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
							<DropdownMenuItem
								className="text-destructive"
								disabled={isRevoked || !canRevoke}
								onSelect={() => onRevoke(row.original)}
							>
								<Ban className="text-destructive" /> Revogar
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];
}
