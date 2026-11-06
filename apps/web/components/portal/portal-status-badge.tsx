"use client";

import { useTranslation } from "@fixr/i18n/react";
import type { PortalServiceOrderStatus } from "@/lib/services/portal";
import { cn } from "@/lib/utils";

/** Color of each step: neutral while waiting, amber when it's on the customer, green when done. */
export const PORTAL_STATUS_TONE: Record<PortalServiceOrderStatus, string> = {
	pending: "bg-muted text-muted-foreground",
	diagnosing: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
	waiting_approval: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
	approved: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
	fixing: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
	ready: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
	delivered: "bg-muted text-muted-foreground",
};

export function PortalStatusBadge({
	status,
	className,
}: {
	status: PortalServiceOrderStatus;
	className?: string;
}) {
	const { t } = useTranslation();

	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 font-medium text-xs",
				PORTAL_STATUS_TONE[status],
				className
			)}
		>
			{t(`portal.status.${status}`)}
		</span>
	);
}
