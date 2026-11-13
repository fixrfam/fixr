"use client";

import { useTranslation } from "@fixr/i18n/react";
import { KanbanSquare, List } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VIEWS = ["list", "board"] as const;

/** `?view=board` or the list; kept in the URL so a pool reopens the way it was left. */
export function useServiceOrdersView() {
	return useQueryState(
		"view",
		parseAsStringLiteral(VIEWS)
			.withDefault("list")
			.withOptions({ history: "replace", clearOnDefault: true })
	);
}

export function ViewToggle() {
	const { t } = useTranslation();
	const [view, setView] = useServiceOrdersView();

	return (
		<fieldset
			aria-label={t("serviceOrders.views.label")}
			className="inline-flex shrink-0 rounded-md border p-0.5"
		>
			{VIEWS.map((option) => {
				const Icon = option === "list" ? List : KanbanSquare;
				return (
					<Button
						aria-pressed={view === option}
						className={cn(
							"h-7 gap-1.5 px-2.5",
							view === option && "bg-muted text-foreground"
						)}
						key={option}
						onClick={() => setView(option)}
						size="sm"
						type="button"
						variant="ghost"
					>
						<Icon className="size-3.5" />
						{t(
							option === "list"
								? "serviceOrders.views.list"
								: "serviceOrders.views.board"
						)}
					</Button>
				);
			})}
		</fieldset>
	);
}
