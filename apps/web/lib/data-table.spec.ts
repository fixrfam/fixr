import { describe, expect, it } from "vitest";
import { dataTableConfig } from "@/config/data-table";
import {
	getColumnPinningStyles,
	getDefaultFilterOperator,
	getFilterOperators,
	getValidFilters,
} from "./data-table";

describe("getFilterOperators", () => {
	it.each([
		["text", dataTableConfig.textOperators],
		["number", dataTableConfig.numericOperators],
		["range", dataTableConfig.numericOperators],
		["date", dataTableConfig.dateOperators],
		["boolean", dataTableConfig.booleanOperators],
		["multiSelect", dataTableConfig.multiSelectOperators],
	] as const)("maps %s", (variant, operators) => {
		expect(getFilterOperators(variant)).toBe(operators);
	});

	it("falls back to the text operators", () => {
		expect(getFilterOperators("nope" as never)).toBe(
			dataTableConfig.textOperators
		);
	});
});

describe("getDefaultFilterOperator", () => {
	it("uses the first operator of the variant", () => {
		expect(getDefaultFilterOperator("text")).toBe("iLike");
		expect(getDefaultFilterOperator("number")).toBe("eq");
	});
});

describe("getValidFilters", () => {
	const filter = (value: unknown, operator = "eq") =>
		({ id: "name", value, operator, variant: "text", filterId: "f" }) as never;

	it("keeps filters with a value and the empty-check operators", () => {
		const valid = [
			filter("abc"),
			filter(["a"]),
			filter("", "isEmpty"),
			filter("", "isNotEmpty"),
		];

		expect(getValidFilters(valid)).toEqual(valid);
	});

	it("drops filters without a value", () => {
		expect(
			getValidFilters([filter(""), filter([]), filter(null), filter(undefined)])
		).toEqual([]);
	});
});

describe("getColumnPinningStyles", () => {
	const column = (pinned: false | "left" | "right", edge = false) =>
		({
			getIsPinned: () => pinned,
			getIsLastColumn: () => edge,
			getIsFirstColumn: () => edge,
			getStart: () => 10,
			getAfter: () => 20,
			getSize: () => 150,
		}) as never;

	it("keeps unpinned columns in the flow", () => {
		expect(getColumnPinningStyles({ column: column(false) })).toMatchObject({
			position: "relative",
			left: undefined,
			right: undefined,
			opacity: 1,
			width: 150,
		});
	});

	it("sticks pinned columns and adds the edge shadow when asked", () => {
		expect(
			getColumnPinningStyles({ column: column("left", true), withBorder: true })
		).toMatchObject({
			position: "sticky",
			left: "10px",
			boxShadow: "-4px 0 4px -4px var(--border) inset",
			zIndex: 1,
		});
		expect(
			getColumnPinningStyles({
				column: column("right", true),
				withBorder: true,
			})
		).toMatchObject({
			right: "20px",
			boxShadow: "4px 0 4px -4px var(--border) inset",
		});
	});
});
