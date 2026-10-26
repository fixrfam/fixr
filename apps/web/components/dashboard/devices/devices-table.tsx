"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { parseAsStringLiteral } from "nuqs";
import { useMemo, useState } from "react";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import {
	useCatalogParams,
	useCatalogTable,
	useOutOfRangePage,
	useSearchInput,
} from "@/components/dashboard/parts/table/use-catalog-table";
import { DashLink } from "@/components/dashboard/service-order/dash-link";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCpf } from "@/lib/format";
import type { DeviceRow } from "@/lib/services/devices";
import { cn } from "@/lib/utils";
import { useSubdomain } from "../customers/store";
import { DeleteDeviceDialog } from "./delete-device-dialog";
import { DeviceActions } from "./device-actions";
import { DeviceFormDialog } from "./device-form-dialog";
import { DEVICE_STATUSES, DeviceStatusBadge } from "./device-status-badge";
import { useDevicesPage } from "./store";

const ALL = "all";
const deviceFilters = {
	status: parseAsStringLiteral(DEVICE_STATUSES),
};

const columnHelper = createColumnHelper<DeviceRow>();

/** The device's model, brand and identifiers. */
export function DeviceCell({ device }: { device: DeviceRow }) {
	return (
		<div className="flex flex-col">
			<span className="font-medium">{device.model.name}</span>
			<span className="text-2xs text-muted-foreground">
				{[device.maker.name, device.category?.name].filter(Boolean).join(" · ")}
			</span>
		</div>
	);
}

function useDeviceColumns({
	onEdit,
	onDelete,
}: {
	onEdit: (device: DeviceRow) => void;
	onDelete: (device: DeviceRow) => void;
}) {
	const { t, format } = useTranslation();
	const subdomain = useSubdomain();

	return useMemo(
		() => [
			columnHelper.display({
				id: "device",
				header: t("devices.table.headers.device"),
				cell: ({ row }) => <DeviceCell device={row.original} />,
				meta: { label: t("devices.table.headers.device") },
			}),
			columnHelper.display({
				id: "owner",
				header: t("devices.table.headers.owner"),
				cell: ({ row }) => (
					<DashLink
						className="flex flex-col hover:underline"
						href={`/customers/${row.original.customer.id}`}
						subdomain={subdomain}
					>
						<span>{row.original.customer.name}</span>
						<span className="text-2xs text-muted-foreground tabular-nums">
							{formatCpf(row.original.customer.cpf)}
						</span>
					</DashLink>
				),
				meta: { label: t("devices.table.headers.owner") },
			}),
			columnHelper.display({
				id: "identifiers",
				header: t("devices.table.headers.identifiers"),
				cell: ({ row }) => {
					const ids = [row.original.imei, row.original.serialNumber].filter(
						Boolean
					);
					return ids.length > 0 ? (
						<span className="text-xs tabular-nums">{ids.join(" / ")}</span>
					) : (
						<span className="text-2xs text-muted-foreground">
							{t("devices.table.noIdentifiers")}
						</span>
					);
				},
				meta: { label: t("devices.table.headers.identifiers") },
			}),
			columnHelper.display({
				id: "status",
				header: t("devices.table.headers.status"),
				cell: ({ row }) => <DeviceStatusBadge status={row.original.status} />,
				meta: { label: t("devices.table.headers.status") },
			}),
			columnHelper.accessor("updatedAt", {
				header: t("devices.table.headers.updatedAt"),
				cell: ({ getValue }) => (
					<span className="text-xs">{format.date(getValue())}</span>
				),
				meta: { label: t("devices.table.headers.updatedAt") },
			}),
			columnHelper.display({
				id: "actions",
				header: () => (
					<span className="sr-only">{t("devices.table.headers.actions")}</span>
				),
				cell: ({ row }) => (
					<div className="flex justify-end">
						<DeviceActions
							device={row.original}
							onDelete={onDelete}
							onEdit={onEdit}
						/>
					</div>
				),
			}),
		],
		[t, format, subdomain, onEdit, onDelete]
	) as ColumnDef<DeviceRow>[];
}

/** The customers' devices: search, status filter and the device actions. */
export function DevicesTable() {
	const { t } = useTranslation();
	const ability = useCatalogAbility();
	const [creating, setCreating] = useState(false);
	const [editing, setEditing] = useState<DeviceRow | undefined>();
	const [deleting, setDeleting] = useState<string | null>(null);
	const { params, refine, setPagination, reset } =
		useCatalogParams(deviceFilters);
	const search = useSearchInput(params.q, (q) => refine({ q }));

	const query = useDevicesPage({
		page: params.page,
		perPage: params.perPage,
		query: params.q,
		status: params.status ?? undefined,
		sort: "updated",
	});
	useOutOfRangePage(query, params, setPagination);

	const columns = useDeviceColumns({
		onEdit: setEditing,
		onDelete: (device) => setDeleting(device.id),
	});
	const table = useCatalogTable({
		data: query.data?.records ?? [],
		columns,
		page: params.page,
		perPage: params.perPage,
		pageCount: query.data?.pagination.total_pages ?? 0,
		rowCount: query.data?.pagination.total_records ?? 0,
		onPaginationChange: setPagination,
	});

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex w-full items-center gap-3">
					<Input
						className="max-w-md"
						onChange={(e) => search.setInput(e.target.value)}
						placeholder={t("devices.table.search")}
						value={search.input}
					/>
					<Select
						onValueChange={(value) =>
							refine({
								status:
									value === ALL
										? null
										: (value as (typeof DEVICE_STATUSES)[number]),
							})
						}
						value={params.status ?? ALL}
					>
						<SelectTrigger
							aria-label={t("devices.table.statusFilter")}
							className="w-auto"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>
								{t("devices.table.allStatuses")}
							</SelectItem>
							{DEVICE_STATUSES.map((status) => (
								<SelectItem key={status} value={status}>
									{t(`devices.status.${status}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button onClick={reset} variant="ghost">
						{t("common.actions.clear")}
					</Button>
				</div>
				{ability.can(permissions.devices.create) && (
					<Button className="shrink-0" onClick={() => setCreating(true)}>
						{t("devices.table.create")} <Plus className="size-3.5" />
					</Button>
				)}
			</div>
			{query.isPending ? (
				<Skeleton className="h-96 w-full rounded-md" />
			) : (
				<DataTable
					aria-busy={query.isPlaceholderData}
					className={cn(
						"w-full transition-opacity",
						query.isPlaceholderData && "opacity-60"
					)}
					table={table}
				/>
			)}
			<DeviceFormDialog onOpenChange={setCreating} open={creating} />
			<DeviceFormDialog
				device={editing}
				onOpenChange={(open) => !open && setEditing(undefined)}
				open={Boolean(editing)}
			/>
			<DeleteDeviceDialog
				deviceId={deleting}
				onOpenChange={(open) => !open && setDeleting(null)}
			/>
		</div>
	);
}
