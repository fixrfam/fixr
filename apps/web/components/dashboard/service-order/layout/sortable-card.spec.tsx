import {
	DndContext,
	KeyboardSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { SortableCard } from "./sortable-card";

function Board({
	children,
	onDragStart,
}: {
	children: ReactNode;
	onDragStart: () => void;
}) {
	const sensors = useSensors(useSensor(KeyboardSensor));
	return (
		<DndContext onDragStart={onDragStart} sensors={sensors}>
			<SortableContext items={["lifecycle"]}>
				<SortableCard id="lifecycle">{children}</SortableCard>
			</SortableContext>
		</DndContext>
	);
}

describe("SortableCard", () => {
	it("lets a field in a dialog opened from the card take spaces", async () => {
		const user = userEvent.setup();
		const onDragStart = vi.fn();
		// Dialogs render in a portal, but React still bubbles their events here.
		render(
			<Board onDragStart={onDragStart}>
				{createPortal(<textarea aria-label="Note" />, document.body)}
			</Board>
		);
		const note = screen.getByRole("textbox", { name: "Note" });

		await user.type(note, "screen replaced");

		expect(note).toHaveValue("screen replaced");
		expect(note).toHaveFocus();
		expect(onDragStart).not.toHaveBeenCalled();
	});

	it("lets a field inside the card take spaces", async () => {
		const user = userEvent.setup();
		const onDragStart = vi.fn();
		render(
			<Board onDragStart={onDragStart}>
				<input aria-label="Search" />
			</Board>
		);

		await user.type(screen.getByRole("textbox", { name: "Search" }), "a b");

		expect(screen.getByRole("textbox", { name: "Search" })).toHaveValue("a b");
		expect(onDragStart).not.toHaveBeenCalled();
	});

	it("still starts a keyboard drag from the focused card", async () => {
		const user = userEvent.setup();
		const onDragStart = vi.fn();
		render(<Board onDragStart={onDragStart}>content</Board>);

		await user.tab();
		await user.keyboard(" ");

		expect(onDragStart).toHaveBeenCalled();
	});
});
