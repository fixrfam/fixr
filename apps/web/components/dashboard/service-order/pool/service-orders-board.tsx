"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import { toast } from "@pheralb/toast";
import { UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import { useSearchInput } from "@/components/dashboard/parts/table/use-catalog-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Kanban,
	KanbanBoard,
	KanbanColumn,
	KanbanColumnContent,
	KanbanItem,
	KanbanItemHandle,
	KanbanOverlay,
} from "@/components/ui/kanban";
import { Skeleton } from "@/components/ui/skeleton";
import { serviceOrderStatusKeys } from "@/lib/i18n/labels";
import type {
	ServiceOrderRow,
	ServiceOrderScope,
	ServiceOrderStatus,
} from "@/lib/services/service-orders";
import { cn } from "@/lib/utils";
import { ServiceOrderStatusBadge } from "../service-order-status-badge";
import {
	useMoveServiceOrder,
	useOrderCode,
	useServiceOrdersPage,
} from "../store";
import { SectorFilter, useSectorFilter } from "./sector-filter";
import { ViewToggle } from "./view-toggle";

const STATUSES = serviceOrderStatuses.options;
/** The API's page limit: the board shows the most recent orders of the pool. */
const BOARD_SIZE = 100;

type Columns = Record<ServiceOrderStatus, ServiceOrderRow[]>;

function byStatus(records: ServiceOrderRow[]): Columns {
	const columns = Object.fromEntries(
		STATUSES.map((status) => [status, [] as ServiceOrderRow[]])
	) as Columns;
	for (const order of records) {
		columns[order.status].push(order);
	}
	return columns;
}

function OrderCard({
	order,
	onOpen,
}: {
	order: ServiceOrderRow;
	onOpen?: () => void;
}) {
	const { t } = useTranslation();
	const orderCode = useOrderCode();

	return (
		<button
			className="grid w-full gap-1.5 rounded-md border bg-card p-3 text-left text-xs shadow-xs transition-colors hover:bg-muted/40"
			onClick={onOpen}
			type="button"
		>
			<div className="flex items-center justify-between gap-2">
				<span className="font-semibold tabular-nums">
					{orderCode(order.number)}
				</span>
				{order.sector && (
					<Badge className="truncate" variant="outline">
						{order.sector.name}
					</Badge>
				)}
			</div>
			<span className="truncate font-medium text-sm">
				{order.deviceMaker.name} {order.model.name}
			</span>
			<span className="truncate text-muted-foreground">
				{order.customer.name}
			</span>
			<span
				className={cn(
					"flex items-center gap-1 text-muted-foreground",
					!order.assignee && "italic"
				)}
			>
				<UserRound className="size-3" />
				{order.assignee?.name ?? t("serviceOrders.board.unassigned")}
			</span>
		</button>
	);
}

/**
 * The pool as one column per status. Dropping a card in another column moves
 * the order there (and its device with it), like the status dialog does.
 */
export function ServiceOrdersBoard({
	subdomain,
	scope,
}: {
	subdomain: string;
	scope: ServiceOrderScope;
}) {
	const { t } = useTranslation();
	const router = useRouter();
	const orderCode = useOrderCode();
	const toastError = useApiErrorToast();
	const canMove = useCatalogAbility().can(
		permissions.serviceOrders.changeStatus
	);
	const move = useMoveServiceOrder();
	const [sectorId] = useSectorFilter();
	const [q, setQ] = useState("");
	const search = useSearchInput(q, setQ);

	const query = useServiceOrdersPage({
		page: 1,
		perPage: BOARD_SIZE,
		query: q,
		scope,
		sectorId: scope === "all" ? (sectorId ?? undefined) : undefined,
		sort: "newer",
	});
	const records = query.data?.records;

	const [columns, setColumns] = useState<Columns>(() => byStatus([]));
	useEffect(() => {
		setColumns(byStatus(records ?? []));
	}, [records]);

	const open = (order: ServiceOrderRow) =>
		router.push(`/dashboard/${subdomain}/service-orders/${order.id}`);

	async function commit(
		value: Record<string, ServiceOrderRow[]>,
		previous: Record<string, ServiceOrderRow[]>,
		activeId: string
	) {
		const to = STATUSES.find((status) =>
			value[status]?.some((order) => order.id === activeId)
		);
		const order = Object.values(previous)
			.flat()
			.find((row) => row.id === activeId);
		if (!(to && order) || order.status === to) {
			return;
		}

		try {
			await move.mutateAsync({ id: order.id, status: to });
			toast.success({
				text: t("serviceOrders.board.moved", {
					code: orderCode(order.number),
					status: t(serviceOrderStatusKeys[to]),
				}),
			});
		} catch (error) {
			setColumns(previous as Columns);
			toastError(error);
		}
	}

	const total = query.data?.pagination.total_records ?? 0;

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<Input
					className="max-w-sm"
					onChange={(e) => search.setInput(e.target.value)}
					placeholder={t("serviceOrders.table.search")}
					value={search.input}
				/>
				<div className="flex items-center gap-3">
					{scope === "all" && <SectorFilter />}
					<ViewToggle />
				</div>
			</div>

			{total > BOARD_SIZE && (
				<p className="text-muted-foreground text-xs">
					{t("serviceOrders.board.truncated", { count: BOARD_SIZE })}
				</p>
			)}

			{query.isPending ? (
				<Skeleton className="h-96 w-full rounded-md" />
			) : (
				<Kanban
					getItemValue={(order) => order.id}
					onValueChange={(value) => setColumns(value as Columns)}
					onValueCommit={(value, meta) => {
						if (meta.kind === "item") {
							commit(value, meta.previousValue, String(meta.event.active.id));
						}
					}}
					restoreOnCancel
					value={columns}
				>
					<div className="overflow-x-auto pb-2">
						<KanbanBoard className="flex min-w-max auto-rows-auto items-start gap-3 sm:grid-cols-none">
							{STATUSES.map((status) => (
								<KanbanColumn
									className="w-64 shrink-0 gap-2 rounded-lg bg-muted/40 p-2"
									key={status}
									value={status}
								>
									<div className="flex items-center justify-between px-1">
										<ServiceOrderStatusBadge variant={status}>
											{t(serviceOrderStatusKeys[status])}
										</ServiceOrderStatusBadge>
										<span className="text-muted-foreground text-xs tabular-nums">
											{columns[status].length}
										</span>
									</div>
									<KanbanColumnContent className="min-h-24" value={status}>
										{columns[status].length === 0 && (
											<p className="py-6 text-center text-muted-foreground text-xs">
												{t("serviceOrders.board.empty")}
											</p>
										)}
										{columns[status].map((order) => (
											<KanbanItem
												disabled={!canMove || move.isPending}
												key={order.id}
												value={order.id}
											>
												<KanbanItemHandle asChild cursor={canMove}>
													<div>
														<OrderCard
															onOpen={() => open(order)}
															order={order}
														/>
													</div>
												</KanbanItemHandle>
											</KanbanItem>
										))}
									</KanbanColumnContent>
								</KanbanColumn>
							))}
						</KanbanBoard>
					</div>
					<KanbanOverlay>
						{({ value }) => {
							const order = Object.values(columns)
								.flat()
								.find((row) => row.id === value);
							return order ? <OrderCard order={order} /> : null;
						}}
					</KanbanOverlay>
				</Kanban>
			)}
		</div>
	);
}
