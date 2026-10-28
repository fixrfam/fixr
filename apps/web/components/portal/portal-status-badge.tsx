"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Badge } from "@/components/ui/badge";
import type { PortalServiceOrderStatus } from "@/lib/services/portal";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<PortalServiceOrderStatus, string> = {
	pending: "bg-muted text-muted-foreground",
	diagnosing: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
	waiting_approval: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
	approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
	fixing: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
	ready: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
	delivered: "bg-muted text-muted-foreground",
};

export function PortalStatusBadge({
	status,
}: {
	status: PortalServiceOrderStatus;
}) {
	const { t } = useTranslation();

	return (
		<Badge className={cn("border-0", STATUS_STYLES[status])} variant="outline">
			{t(`portal.status.${status}`)}
		</Badge>
	);
}
