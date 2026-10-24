"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Badge } from "@/components/ui/badge";
import type { EstimateStatus } from "@/lib/services/estimates";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<EstimateStatus, string> = {
	draft: "bg-muted text-muted-foreground",
	sent: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
	approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
	rejected: "bg-red-500/15 text-red-700 dark:text-red-300",
};

export function EstimateStatusBadge({ status }: { status: EstimateStatus }) {
	const { t } = useTranslation();

	return (
		<Badge className={cn("border-0", STATUS_STYLES[status])} variant="outline">
			{t(`estimates.status.${status}`)}
		</Badge>
	);
}
