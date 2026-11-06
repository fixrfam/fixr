/**
 * Lines of a service order (or an estimate) in reading order: each top level
 * line followed by the parts its service uses. A part whose service line is
 * missing reads as a top level line.
 */
export function inReadingOrder<
	T extends { id: string; parentItemId: string | null },
>(items: T[]) {
	const ids = new Set(items.map((item) => item.id));
	const isNested = (item: T) =>
		Boolean(item.parentItemId && ids.has(item.parentItemId));

	return items
		.filter((item) => !isNested(item))
		.flatMap((line) => [
			{ item: line, nested: false },
			...items
				.filter((part) => part.parentItemId === line.id)
				.map((part) => ({ item: part, nested: true })),
		]);
}
