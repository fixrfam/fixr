"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DroppableColumnProps {
	id: "left" | "right";
	children: React.ReactNode;
}

export function DroppableColumn({ id, children }: DroppableColumnProps) {
	const { setNodeRef, isOver } = useDroppable({ id });

	return (
		<div
			className={cn("space-y-6", isOver && "rounded-lg ring-1 ring-primary/20")}
			ref={setNodeRef}
		>
			{children}
		</div>
	);
}
