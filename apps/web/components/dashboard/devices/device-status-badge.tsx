"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Badge } from "@/components/ui/badge";
import type { DeviceStatus } from "@/lib/services/devices";
import { cn } from "@/lib/utils";

const STATUS_CLASS: Record<DeviceStatus, string> = {
	in_shop: "bg-amber-600/20 text-amber-800 dark:text-amber-300",
	ready_for_pickup: "bg-emerald-600/20 text-emerald-800 dark:text-emerald-300",
	with_customer: "bg-muted text-muted-foreground",
};

export const DEVICE_STATUSES: DeviceStatus[] = [
	"in_shop",
	"ready_for_pickup",
	"with_customer",
];

/** Where a customer's device is right now. */
export function DeviceStatusBadge({
	status,
	className,
}: {
	status: DeviceStatus;
	className?: string;
}) {
	const { t } = useTranslation();

	return (
		<Badge
			className={cn("border-transparent", STATUS_CLASS[status], className)}
			variant="outline"
		>
			{t(`devices.status.${status}`)}
		</Badge>
	);
}
