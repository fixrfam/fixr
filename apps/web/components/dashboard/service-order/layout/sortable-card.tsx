"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CardId } from "./utils/constants";

interface SortableCardProps {
	id: CardId;
	children: React.ReactNode;
}

export function SortableCard({ id, children }: SortableCardProps) {
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
			{...listeners}
		>
			<div className="pointer-events-none absolute top-3 right-3 flex items-center gap-1 rounded-full border bg-card px-2 py-1 text-muted-foreground text-xs">
				<GripVertical className="size-3" />
				Arraste
			</div>
			{children}
		</div>
	);
}
