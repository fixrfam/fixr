"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Gather } from "loading-dev";
import { cn } from "@/lib/utils";

/** Fixr's loading indicator: the "gather" spinner from loading.dev. */
export function FixrLoader({
	className,
	label,
	size = 32,
}: {
	/** Color (`text-*`) and placement. */
	className?: string;
	/** Read by screen readers; defaults to "Loading". */
	label?: string;
	/** Side in pixels. */
	size?: number;
}) {
	const { t } = useTranslation();

	return (
		<output
			aria-label={label ?? t("common.states.loading")}
			className={cn("inline-grid place-items-center text-primary", className)}
		>
			<Gather size={size} />
		</output>
	);
}
