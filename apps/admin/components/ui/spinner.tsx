"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
	const { t } = useTranslation();

	return (
		<Loader2Icon
			aria-label={t("common.states.loading")}
			className={cn("size-4 animate-spin", className)}
			role="status"
			{...props}
		/>
	);
}

export { Spinner };
