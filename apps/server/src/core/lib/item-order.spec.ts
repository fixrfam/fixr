import { describe, expect, it } from "vitest";
import { inReadingOrder } from "./item-order";

const line = (id: string, parentItemId: string | null = null) => ({
	id,
	parentItemId,
});

describe("inReadingOrder", () => {
	it("puts the parts of a service right after it, even when added before", () => {
		const ordered = inReadingOrder([
			line("screen", "swap"),
			line("cable"),
			line("swap"),
			line("battery", "swap"),
		]);

		expect(ordered.map(({ item, nested }) => [item.id, nested])).toEqual([
			["cable", false],
			["swap", false],
			["screen", true],
			["battery", true],
		]);
	});

	it("reads a part whose service line is missing as a line of its own", () => {
		expect(inReadingOrder([line("screen", "gone")])).toEqual([
			{ item: line("screen", "gone"), nested: false },
		]);
	});
});
