"use client";

import { useTranslation } from "@fixr/i18n/react";
import { TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { getApiHealthStatus } from "@/lib/services/api";

const apiHealthQuery = getApiHealthStatus();

export function ApiDowntimeBanner() {
	const { t } = useTranslation();
	const healthy = use(apiHealthQuery);

	if (healthy) {
		return;
	}

	return (
		<div className="fixed bottom-2 left-1/2 z-97 -translate-x-1/2 rounded-full bg-background">
			<input className="peer hidden" id="hide-api-banner" type="checkbox" />
			<div className="flex items-center justify-center rounded-full bg-amber-500/30 px-3 py-1.5 peer-checked:hidden">
				<p className="items-center text-center text-amber-900 text-xs dark:text-amber-400">
					<TriangleAlert className="inline-flex size-3.5" />{" "}
					{t("home.banner.apiDown")} –{" "}
					<Link className="underline" href="/downtime">
						{t("home.banner.learnMore")}
					</Link>
				</p>

				<label
					aria-label={t("common.actions.close")}
					className="inline-fle ml-2 cursor-pointer"
					htmlFor="hide-api-banner"
				>
					<X className="size-4 text-amber-900 dark:text-amber-400" />
				</label>
			</div>
		</div>
	);
}
