import type { CardId } from "./constants";

/** Describes which cards are in each column of the resizable layout. */
export interface LayoutState {
	left: CardId[];
	right: CardId[];
}

/** Default card arrangement when no saved layout exists yet. */
export const defaultLayout: LayoutState = {
	left: ["device", "lifecycle", "parts"],
	right: ["summary", "technician", "client", "images"],
};

/**
 * Ensures every available card appears exactly once across both columns,
 * removing any cards that are no longer available (e.g. because the order
 * lacks detail data) and inserting brand new cards into whicever column
 * has room.
 */
export function normalizeLayout(
	layout: LayoutState,
	available: Set<CardId>
): LayoutState {
	const sanitize = (items: CardId[]) =>
		items.filter((item) => available.has(item));
	const left = sanitize(layout.left);
	const right = sanitize(layout.right);
	const missing = Array.from(available).filter(
		(item) => !(left.includes(item) || right.includes(item))
	);
	const nextLeft = left.length > 0 ? left : missing.splice(0, 1);
	const nextRight = right.length > 0 ? right : missing.splice(0, 1);
	const withRemaining = [...missing];
	return {
		left: [
			...nextLeft,
			...withRemaining.splice(0, Math.max(0, 4 - nextLeft.length)),
		],
		right: [...nextRight, ...withRemaining],
	};
}
