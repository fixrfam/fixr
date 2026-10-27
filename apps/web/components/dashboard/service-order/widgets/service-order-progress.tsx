"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { DeviceStatusBadge } from "@/components/dashboard/devices/device-status-badge";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import type { ServiceOrderDetail } from "@/lib/services/service-orders";
import { MoveStatusDialog } from "./move-status-dialog";
import { ServiceOrderLifecycle } from "./service-order-lifecycle";

/**
 * The order's lifecycle and history, where its device is, and (for who can
 * change the status) the way to move it; the device follows.
 */
export function ServiceOrderProgress({ order }: { order: ServiceOrderDetail }) {
	const { t } = useTranslation();
	const ability = useCatalogAbility();

	return (
		<div className="space-y-4">
			<ServiceOrderLifecycle history={order.history} status={order.status} />
			<div className="flex items-center justify-between gap-2 border-t pt-3 text-2xs">
				<span className="text-muted-foreground">
					{t("serviceOrders.fields.deviceStatus")}
				</span>
				<DeviceStatusBadge status={order.device.status} />
			</div>
			{ability.can(permissions.serviceOrders.changeStatus) && (
				<MoveStatusDialog order={order} />
			)}
		</div>
	);
}
