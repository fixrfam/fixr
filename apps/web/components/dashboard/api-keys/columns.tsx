"use client";

import { apiKeyPublicSchema } from "@fixr/db/schema";
import type { Translator } from "@fixr/i18n";
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
export function getKeyStatus(
	t: Translator["t"],
	key: ApiKeyRow
): {
	label: string;
	variant: "default" | "secondary" | "destructive" | "outline";
	className?: string;
} {
	if (key.revokedAt) {
		return {
			label: t("apiKeys.status.revoked"),
			variant: "outline",
			className: "border-destructive/40 text-destructive",
		};
	}

	if (key.expiresAt && new Date(key.expiresAt) <= new Date()) {
		return {
			label: t("apiKeys.status.expired"),
			variant: "outline",
			className: "text-muted-foreground",
		};
	}

	return { label: t("apiKeys.status.active"), variant: "secondary" };
}

export function buildColumns({
	onRevoke,
	canRevoke,
	t,
	format,
}: {
	onRevoke: (key: ApiKeyRow) => void;
	canRevoke: boolean;
	t: Translator["t"];
	format: Translator["format"];
}): ColumnDef<ApiKeyRow>[] {
	const formatDate = (value: Date | string | null) =>
		value ? format.date(value, { dateStyle: "long" }) : "-";

	return [
		{
			accessorKey: "name",
			header: t("apiKeys.table.columns.name"),
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
			header: t("apiKeys.table.columns.status"),
			cell: ({ row }) => {
				const status = getKeyStatus(t, row.original);
				return (
					<Badge className={status.className} variant={status.variant}>
						{status.label}
					</Badge>
				);
			},
		},
		{
			accessorKey: "scopes",
			header: t("apiKeys.table.columns.scopes"),
			cell: ({ row }) => {
				const scopes = row.original.scopes ?? [];

				if (scopes.length === 0) {
					return (
						<span className="text-muted-foreground text-sm">
							{t("apiKeys.table.inheritsRole")}
						</span>
					);
				}

				return (
					<span className="text-sm">
						{t("apiKeys.table.scopeCount", { count: scopes.length })}
					</span>
				);
			},
		},
		{
			accessorKey: "lastUsedAt",
			header: t("apiKeys.table.columns.lastUsed"),
			cell: ({ row }) =>
				row.original.lastUsedAt ? (
					formatDate(row.original.lastUsedAt)
				) : (
					<span className="text-muted-foreground">
						{t("apiKeys.table.neverUsed")}
					</span>
				),
		},
		{
			accessorKey: "expiresAt",
			header: t("apiKeys.table.columns.expiresAt"),
			cell: ({ row }) =>
				row.original.expiresAt ? (
					formatDate(row.original.expiresAt)
				) : (
					<span className="text-muted-foreground">
						{t("apiKeys.table.noExpiration")}
					</span>
				),
		},
		{
			accessorKey: "createdAt",
			header: t("apiKeys.table.columns.createdAt"),
			cell: ({ row }) => formatDate(row.original.createdAt),
		},
		{
			id: "actions",
			header: t("apiKeys.table.columns.actions"),
			cell: ({ row }) => {
				const isRevoked = Boolean(row.original.revokedAt);

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
								{t("apiKeys.table.columns.actions")}
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-destructive"
								disabled={isRevoked || !canRevoke}
								onSelect={() => onRevoke(row.original)}
							>
								<Ban className="text-destructive" />{" "}
								{t("apiKeys.actions.revoke")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];
}
