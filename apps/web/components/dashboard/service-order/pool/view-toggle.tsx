"use client";

import { useTranslation } from "@fixr/i18n/react";
import { KanbanSquare, List } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VIEWS = ["list", "board"] as const;

const STORAGE_KEY = "fixr:service-orders:view";
type View = (typeof VIEWS)[number];

function readStoredView(): View {
	try {
		return localStorage.getItem(STORAGE_KEY) === "board" ? "board" : "list";
	} catch {
		return "list";
	}
}

/**
 * List or board. The URL (`?view=board`) wins; without it, the last view the
 * viewer picked (kept in this browser), so moving between pools keeps it.
 */
export function useServiceOrdersView() {
	const [param, setParam] = useQueryState(
		"view",
		parseAsStringLiteral(VIEWS).withOptions({ history: "replace" })
	);
	const [stored, setStored] = useState<View>("list");
	useEffect(() => {
		setStored(readStoredView());
	}, []);

	const setView = (view: View) => {
		try {
			localStorage.setItem(STORAGE_KEY, view);
		} catch {
			// Private mode or blocked storage: the URL still holds it on this page.
		}
		setStored(view);
		setParam(view === "list" ? null : view);
	};

	return [param ?? stored, setView] as const;
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
