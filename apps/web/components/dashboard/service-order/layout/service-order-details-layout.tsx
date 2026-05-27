"use client";

import {
	closestCenter,
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ServiceOrderRow } from "@fixr/mock";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { getCards } from "./cards";
import { DroppableColumn } from "./droppable-column";
import { SortableCard } from "./sortable-card";
import type { CardId } from "./utils/constants";
import { findContainer } from "./utils/dnd";
import type { LayoutState } from "./utils/layout-state";
import { useResizableLayout } from "./utils/use-resizable-layout";

interface Props {
	order: ServiceOrderRow;
	subdomain: string;
}

/**
 * Placeholder visible inside a column while a card is being dragged over it,
 * showing exactly where the card will land once dropped.
 */
function DropPlaceholder() {
	return (
		<div className="rounded-lg border-2 border-primary/60 border-dashed bg-primary/5 px-4 py-8 text-center text-muted-foreground text-sm">
			Solte aqui para mover o painel
		</div>
	);
}

export function ServiceOrderDetailsLayout({ order, subdomain }: Props) {
	const availableCards = useMemo(() => {
		const cards: CardId[] = [
			"summary",
			"device",
			"technician",
			"client",
			"lifecycle",
			"parts",
			"images",
		];
		return new Set(
			cards.filter((card) => card !== "device" || order.orderDetails)
		);
	}, [order.orderDetails]);

	const storageKey = `service-order-layout:${subdomain}:${order.id}`;
	const [layout, setLayout] = useResizableLayout(storageKey, availableCards);
	const [activeId, setActiveId] = useState<CardId | null>(null);
	const [overId, setOverId] = useState<string | null>(null);
	const [dragWidth, setDragWidth] = useState<number | null>(null);

	/** Tracks mount state so the DragOverlay portal only renders client-side. */
	const [isMounted, setIsMounted] = useState(false);
	useEffect(() => setIsMounted(true), []);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(KeyboardSensor)
	);

	const cards = useMemo(() => getCards(order), [order]);

	const renderCard = (cardId: CardId) => {
		const content = cards[cardId];
		if (!content) {
			return null;
		}
		return <SortableCard id={cardId}>{content}</SortableCard>;
	};

	const renderStaticCard = (cardId: CardId) => {
		const content = cards[cardId];
		return content ?? null;
	};

	/**
	 * Determines at which position inside a column the drop placeholder
	 * should appear. Returns `null` when the place holder should be hidden.
	 *
	 * - If the over target is the column itself the card lands at the end.
	 * - If the over target is another card the placeholder goes before it.
	 */
	const getPlaceholderIndex = (columnId: "left" | "right") => {
		if (!(activeId && overId)) {
			return null;
		}
		const activeContainer = findContainer(layout, String(activeId));
		const overContainer = findContainer(layout, String(overId));
		if (overContainer !== columnId) return null;
		if (activeContainer === overContainer && overId === activeId) return null;
		const items = layout[columnId];
		if (overId === columnId) return items.length;
		const index = items.indexOf(overId as CardId);
		return index >= 0 ? index : items.length;
	};

	return (
		<DndContext
			collisionDetection={closestCenter}
			onDragCancel={() => {
				setActiveId(null);
				setOverId(null);
				setDragWidth(null);
			}}
			onDragEnd={({ active, over }) => {
				setActiveId(null);
				setOverId(null);
				setDragWidth(null);
				if (!over || active.id === over.id) return;
				const activeContainer = findContainer(layout, String(active.id));
				const overContainer = findContainer(layout, String(over.id));
				if (!(activeContainer && overContainer)) return;

				setLayout((prev: LayoutState) => {
					const next = { ...prev };
					const activeItems = [...next[activeContainer]];
					const overItems = [...next[overContainer]];
					const activeIndex = activeItems.indexOf(active.id as CardId);
					const overIndex =
						over.id === overContainer
							? overItems.length
							: overItems.indexOf(over.id as CardId);

					if (activeContainer !== overContainer && activeItems.length === 1) {
						return next;
					}

					if (activeContainer === overContainer) {
						next[activeContainer] = arrayMove(
							activeItems,
							activeIndex,
							overIndex
						);
						return next;
					}

					activeItems.splice(activeIndex, 1);
					overItems.splice(overIndex, 0, active.id as CardId);
					next[activeContainer] = activeItems;
					next[overContainer] = overItems;
					return next;
				});
			}}
			onDragOver={({ over }) => {
				setOverId(over?.id ? String(over.id) : null);
			}}
			onDragStart={({ active }) => {
				setActiveId(active.id as CardId);
				const element = document.querySelector<HTMLElement>(
					`[data-card-id="${active.id}"]`
				);
				if (element) {
					setDragWidth(element.getBoundingClientRect().width);
				}
			}}
			sensors={sensors}
		>
			<div className="hidden gap-6 lg:block">
				<ResizablePanelGroup autoSave={storageKey} className="min-w-6xl gap-6">
					<ResizablePanel defaultSize="55%" minSize="40%">
						<SortableContext
							items={layout.left}
							strategy={verticalListSortingStrategy}
						>
							<DroppableColumn id="left">
								{layout.left.map((cardId, index) => (
									<div className="space-y-6" key={cardId}>
										{getPlaceholderIndex("left") === index && (
											<DropPlaceholder />
										)}
										{renderCard(cardId)}
									</div>
								))}
								{getPlaceholderIndex("left") === layout.left.length && (
									<DropPlaceholder />
								)}
							</DroppableColumn>
						</SortableContext>
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize="45%" minSize="35%">
						<SortableContext
							items={layout.right}
							strategy={verticalListSortingStrategy}
						>
							<DroppableColumn id="right">
								{layout.right.map((cardId, index) => (
									<div className="space-y-6" key={cardId}>
										{getPlaceholderIndex("right") === index && (
											<DropPlaceholder />
										)}
										{renderCard(cardId)}
									</div>
								))}
								{getPlaceholderIndex("right") === layout.right.length && (
									<DropPlaceholder />
								)}
							</DroppableColumn>
						</SortableContext>
					</ResizablePanel>
				</ResizablePanelGroup>
			</div>
			<div className="grid gap-6 lg:hidden">
				{layout.left.map(renderStaticCard)}
				{layout.right.map(renderStaticCard)}
			</div>
			{isMounted
				? createPortal(
						<DragOverlay adjustScale={false}>
							{activeId ? (
								<div
									className="z-1000 inline-block"
									style={dragWidth ? { width: `${dragWidth}px` } : undefined}
								>
									{cards[activeId]}
								</div>
							) : null}
						</DragOverlay>,
						document.body
					)
				: null}
		</DndContext>
	);
}
