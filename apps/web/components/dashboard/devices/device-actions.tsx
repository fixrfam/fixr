"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { ClipboardPlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import { DashLink } from "@/components/dashboard/service-order/dash-link";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DeviceRow } from "@/lib/services/devices";
import { useSubdomain } from "../customers/store";

/** Row menu of a device: edit, open a service order for it, delete. */
export function DeviceActions({
	device,
	onEdit,
	onDelete,
}: {
	device: DeviceRow;
	onEdit: (device: DeviceRow) => void;
	onDelete: (device: DeviceRow) => void;
}) {
	const { t } = useTranslation();
	const subdomain = useSubdomain();
	const ability = useCatalogAbility();
	const canOpenOrder = ability.can(permissions.serviceOrders.create);
	const canEdit = ability.can(permissions.devices.update);
	const canDelete = ability.can(permissions.devices.delete);

	if (!(canOpenOrder || canEdit || canDelete)) {
		return null;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					aria-label={t("devices.actions.menu")}
					onClick={(event) => event.stopPropagation()}
					size="icon"
					variant="ghost"
				>
					<MoreHorizontal className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
				{canOpenOrder && (
					<DropdownMenuItem asChild>
						<DashLink
							href={`/service-orders/new?deviceId=${device.id}`}
							subdomain={subdomain}
						>
							<ClipboardPlus className="size-3.5" />
							{t("devices.actions.openServiceOrder")}
						</DashLink>
					</DropdownMenuItem>
				)}
				{canEdit && (
					<DropdownMenuItem onSelect={() => onEdit(device)}>
						<Pencil className="size-3.5" />
						{t("devices.actions.edit")}
					</DropdownMenuItem>
				)}
				{canDelete && (
					<DropdownMenuItem
						onSelect={() => onDelete(device)}
						variant="destructive"
					>
						<Trash2 className="size-3.5" />
						{t("devices.actions.delete")}
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
