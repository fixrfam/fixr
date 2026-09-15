"use client";

import { createAbility, permissions } from "@fixr/permissions";
import {
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useSession } from "@/lib/hooks/use-session";
import { type ApiKeyRow, buildColumns } from "./columns";
import { CreateApiKeySheet } from "./create-api-key-sheet";
import { RevokeApiKeyDialog } from "./revoke-api-key-dialog";

export function ApiKeysTable({ data }: { data: ApiKeyRow[] }) {
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [revoking, setRevoking] = useState<ApiKeyRow | null>(null);
	const { session } = useSession();

	// Same approach the sidebar uses: the ability comes from the session role.
	const ability = createAbility(session?.company?.role ?? "guest");

	const canRevoke = ability.can(permissions.apiKeys.revoke);

	const columns = useMemo(
		() => buildColumns({ onRevoke: setRevoking, canRevoke }),
		[canRevoke]
	);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		state: { columnFilters },
	});

	return (
		<div>
			<div className="flex flex-wrap items-center justify-between gap-2 py-4">
				<div className="relative">
					<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						className="w-full max-w-md pl-9"
						onChange={(event) =>
							table.getColumn("name")?.setFilterValue(event.target.value)
						}
						placeholder="Procurar nas suas chaves..."
						value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
					/>
				</div>
				{ability.can(permissions.apiKeys.create) && <CreateApiKeySheet />}
			</div>
			<div className="rounded-md border bg-background">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell className="h-18 py-3" key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									className="h-18 text-center"
									colSpan={columns.length}
								>
									Você ainda não criou nenhuma chave
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<RevokeApiKeyDialog
				apiKey={revoking}
				onOpenChange={(open) => {
					if (!open) {
						setRevoking(null);
					}
				}}
			/>
		</div>
	);
}
