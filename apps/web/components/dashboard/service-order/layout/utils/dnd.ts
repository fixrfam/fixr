import type { CardId } from "./constants";
import type { LayoutState } from "./layout-state";

/**
 * Given a drag id (a column name or a card id), returns which column
 * the item belongs to – or `null` if it isn't found anywhere.
 */
export function findContainer(
	layout: LayoutState,
	id: string
): "left" | "right" | null {
	if (id === "left" || id === "right") {
		return id;
	}
	if (layout.left.includes(id as CardId)) {
		return "left";
	}
	if (layout.right.includes(id as CardId)) {
		return "right";
	}
	return null;
}
