"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "@fixr/i18n/react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CardId } from "./utils/constants";

interface SortableCardProps {
	id: CardId;
	children: React.ReactNode;
}

export function SortableCard({ id, children }: SortableCardProps) {
	const { t } = useTranslation();
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	/**
	 * React events bubble through portals, so keys typed in a dialog opened
	 * from a card (or in a field inside it) would reach these listeners and
	 * start a keyboard drag on Space/Enter. Only the card itself starts one,
	 * and only pointers that land on the card's own DOM start a pointer drag.
	 */
	const guardedListeners = {
		...listeners,
		onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
			if (event.target === event.currentTarget) {
				listeners?.onKeyDown?.(event);
			}
		},
		onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
			if (event.currentTarget.contains(event.target as Node)) {
				listeners?.onPointerDown?.(event);
			}
		},
	};

	return (
		<div
			className={cn(
				"relative cursor-grab touch-none bg-background transition-shadow",
				isDragging && "opacity-50"
			)}
			data-card-id={id}
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...guardedListeners}
		>
			<div className="pointer-events-none absolute top-3 right-3 flex items-center gap-1 rounded-full border bg-card px-2 py-1 text-muted-foreground text-xs">
				<GripVertical className="size-3" />
				{t("serviceOrders.layout.drag")}
			</div>
			{children}
		</div>
	);
}
