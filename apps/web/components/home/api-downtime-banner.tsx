"use client";

import { TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { getApiHealthStatus } from "@/lib/services/api";

const apiHealthQuery = getApiHealthStatus();

export function ApiDowntimeBanner() {
	const healthy = use(apiHealthQuery);

	if (healthy) {
		return;
	}

	return (
		<div className="fixed bottom-2 z-97">
			<input className="peer hidden" id="hide-api-banner" type="checkbox" />
			<div className="flex items-center justify-center rounded-full bg-amber-500/30 px-3 py-1.5 peer-checked:hidden">
				<p className="items-center text-center text-amber-900 text-xs dark:text-amber-400">
					<TriangleAlert className="inline-flex size-3.5" /> API indisponível –{" "}
					<Link className="underline" href="/downtime">
						Saiba mais
					</Link>
				</p>

				<label
					aria-label="Fechar"
					className="inline-fle ml-2 cursor-pointer"
					htmlFor="hide-api-banner"
				>
					<X className="size-4 text-amber-900 dark:text-amber-400" />
				</label>
			</div>
		</div>
	);
}
