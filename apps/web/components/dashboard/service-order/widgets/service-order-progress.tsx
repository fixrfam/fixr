"use client";

import { useTranslation } from "@fixr/i18n/react";
import { DeviceStatusBadge } from "@/components/dashboard/devices/device-status-badge";
import type { ServiceOrderDetail } from "@/lib/services/service-orders";
import { ServiceOrderLifecycle } from "./service-order-lifecycle";

/**
 * The order's lifecycle and history and where its device is. Moving it lives
 * in the page header ({@link ServiceOrderActions}).
 */
export function ServiceOrderProgress({ order }: { order: ServiceOrderDetail }) {
	const { t } = useTranslation();

	return (
		<div className="space-y-4">
			<ServiceOrderLifecycle history={order.history} status={order.status} />
			<div className="flex items-center justify-between gap-2 border-t pt-3 text-2xs">
				<span className="text-muted-foreground">
					{t("serviceOrders.fields.deviceStatus")}
				</span>
				<DeviceStatusBadge status={order.device.status} />
			</div>
		</div>
	);
}
