"use client";

import { mockServiceOrders, type ServiceOrderRow } from "@fixr/mock";
import {
	createColumnHelper,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { DashLink } from "../service-order/dash-link";

const columnHelper = createColumnHelper<ServiceOrderRow>();

interface Props {
	subdomain: string;
}

const STATUS_STYLE_MAP_TABLE = {
	parts_pending: "bg-green-400 text-green-900",
	analysis: "bg-green-400 text-green-900",
	finished: "bg-blue-400 text-blue-900",
	canceled: "bg-rose-400 text-rose-900",
	quote_pending: "bg-green-400 text-green-900",
	approval_pending: "bg-green-400 text-green-900",
	in_progress: "bg-blue-400 text-blue-900",
	ready_for_pickup: "bg-green-400 text-green-900",
	contacted: "bg-gray-400 text-gray-900",
} as const;

function getStatusClassTable(statusId: string) {
	return (
		STATUS_STYLE_MAP_TABLE[statusId as keyof typeof STATUS_STYLE_MAP_TABLE] ??
		"bg-gray-100 text-gray-900"
	);
}

export function ServiceOrdersTable({ subdomain }: Props) {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("");
	const [lineFilter, setLineFilter] = useState<string>("");
	const [techFilter, setTechFilter] = useState<string>("");

	// derive filter options from mock
	const statusOptions = useMemo(
		() =>
			Array.from(
				new Map(
					mockServiceOrders.map((s) => [
						s.status.id,
						{ id: s.status.id, label: s.status.label },
					])
				).values()
			),
		[]
	);
	const lineOptions = useMemo(
		() => Array.from(new Set(mockServiceOrders.map((s) => s.line))),
		[]
	);
	const techOptions = useMemo(
		() => Array.from(new Set(mockServiceOrders.map((s) => s.technician))),
		[]
	);

	const filteredData = useMemo(() => {
		return mockServiceOrders.filter((row) => {
			if (search) {
				const num = String(row.orderNumber).toLowerCase();
				if (!num.includes(search.toLowerCase())) {
					return false;
				}
			}
			if (statusFilter && row.status.id !== statusFilter) {
				return false;
			}
			if (lineFilter && row.line !== lineFilter) {
				return false;
			}
			if (techFilter && row.technician !== techFilter) {
				return false;
			}
			return true;
		});
	}, [search, statusFilter, lineFilter, techFilter]);

	const columns = useMemo(
		() => [
			columnHelper.accessor("orderNumber", {
				header: "Número da ordem",
				cell: ({ getValue }) => (
					<span className="font-medium">{getValue()}</span>
				),
			}),
			columnHelper.accessor("line", { header: "Linha" }),
			columnHelper.accessor("technician", { header: "Técnico responsável" }),
			columnHelper.accessor("status", {
				header: "Status",
				cell: ({ row }) => {
					const status = row.original.status;
					return (
						<span
							className={`inline-flex items-center rounded-lg px-2.5 py-1 font-semibold text-xs ${getStatusClassTable(
								status.id
							)}`}
						>
							{status.label}
						</span>
					);
				},
			}),
			columnHelper.display({
				id: "actions",
				header: () => <div className="text-right">Ações</div>,
				cell: ({ row }) => (
					<div className="text-right">
						<Button asChild size="sm" type="button" variant="outline">
							<DashLink
								href={`/service-orders/${row.original.id}`}
								subdomain={subdomain}
							>
								Ver mais
							</DashLink>
						</Button>
					</div>
				),
			}),
		],
		[subdomain]
	);

	const table = useReactTable({
		data: filteredData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: {
				pageIndex: 0,
				pageSize: 10,
			},
		},
	});

	return (
		<div className="space-y-4">
			{/* search + filters */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex w-full items-center gap-3">
					<Input
						className="max-w-sm"
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Busque pelo número da ordem de serviço..."
						value={search}
					/>

					<select
						className="rounded-md border bg-popover px-3 py-2 text-foreground text-sm"
						onChange={(e) => setStatusFilter(e.target.value)}
						value={statusFilter}
					>
						<option value="">Todos os status</option>
						{statusOptions.map((s) => (
							<option key={s.id} value={s.id}>
								{s.label}
							</option>
						))}
					</select>

					<select
						className="rounded-md border bg-popover px-3 py-2 text-foreground text-sm"
						onChange={(e) => setLineFilter(e.target.value)}
						value={lineFilter}
					>
						<option value="">Todas as linhas</option>
						{lineOptions.map((l) => (
							<option key={l} value={l}>
								{l}
							</option>
						))}
					</select>

					<select
						className="rounded-md border bg-popover px-3 py-2 text-foreground text-sm"
						onChange={(e) => setTechFilter(e.target.value)}
						value={techFilter}
					>
						<option value="">Todos os técnicos</option>
						{techOptions.map((t) => (
							<option key={t} value={t}>
								{t}
							</option>
						))}
					</select>
				</div>

				<div className="flex items-center gap-2">
					<Button
						onClick={() => {
							setSearch("");
							setStatusFilter("");
							setLineFilter("");
							setTechFilter("");
						}}
						variant="ghost"
					>
						Limpar
					</Button>
				</div>
			</div>

			<DataTable className="w-full" table={table} />
		</div>
	);
}
