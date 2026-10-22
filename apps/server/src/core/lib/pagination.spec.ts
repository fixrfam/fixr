import { beforeEach, describe, expect, it, vi } from "vitest";

const { builder, db } = vi.hoisted(() => {
	const calls: [string, unknown[]][] = [];
	let result: unknown = [];
	const builder: Record<string, unknown> & {
		calls: typeof calls;
		setResult: (value: unknown) => void;
	} = {
		calls,
		setResult: (value: unknown) => {
			result = value;
		},
		// biome-ignore lint/suspicious/noThenProperty: mimics Drizzle's thenable query builder
		then: (resolve: (value: unknown) => unknown) => resolve(result),
	};
	for (const method of [
		"from",
		"$dynamic",
		"where",
		"innerJoin",
		"leftJoin",
		"rightJoin",
		"fullJoin",
		"orderBy",
		"limit",
		"offset",
	]) {
		builder[method] = (...args: unknown[]) => {
			calls.push([method, args]);
			return builder;
		};
	}
	const db = {
		select: vi.fn((...args: unknown[]) => {
			calls.push(["select", args]);
			return builder;
		}),
	};
	return { builder, db };
});

vi.mock("@fixr/db/connection", () => ({
	db,
	count: () => "COUNT(*)",
	getTableColumns: () => ({ id: "table.id" }),
}));

const { getPaginatedCount, getPaginatedRecords } = await import("./pagination");

const methods = () => builder.calls.map(([method]) => method);

describe("getPaginatedRecords", () => {
	beforeEach(() => {
		builder.calls.length = 0;
		builder.setResult([]);
	});

	it("applies order, limit (take) and offset (skip)", async () => {
		builder.setResult([{ id: 1 }]);

		const records = await getPaginatedRecords({
			table: {},
			skip: 20,
			take: 10,
			order: "ORDER" as never,
		});

		expect(records).toEqual([{ id: 1 }]);
		expect(builder.calls).toContainEqual(["orderBy", ["ORDER"]]);
		expect(builder.calls).toContainEqual(["limit", [10]]);
		expect(builder.calls).toContainEqual(["offset", [20]]);
	});

	it("selects every table column when no projection is given", async () => {
		await getPaginatedRecords({
			table: {},
			skip: 0,
			take: 1,
			order: "O" as never,
		});

		expect(db.select).toHaveBeenLastCalledWith({ id: "table.id" });
	});

	it("uses the given projection", async () => {
		await getPaginatedRecords({
			table: {},
			select: { name: "n" },
			skip: 0,
			take: 1,
			order: "O" as never,
		});

		expect(db.select).toHaveBeenLastCalledWith({ name: "n" });
	});

	it("only adds a where clause when a filter is given", async () => {
		await getPaginatedRecords({
			table: {},
			skip: 0,
			take: 1,
			order: "O" as never,
		});
		expect(methods()).not.toContain("where");

		await getPaginatedRecords({
			table: {},
			skip: 0,
			take: 1,
			order: "O" as never,
			where: "W" as never,
		});
		expect(builder.calls).toContainEqual(["where", ["W"]]);
	});

	it("maps every join type to the matching builder method", async () => {
		await getPaginatedRecords({
			table: {},
			skip: 0,
			take: 1,
			order: "O" as never,
			joins: [
				{ type: "inner", table: "t1", on: "o1" as never },
				{ type: "left", table: "t2", on: "o2" as never },
				{ type: "right", table: "t3", on: "o3" as never },
				{ type: "full", table: "t4", on: "o4" as never },
			],
		});

		expect(builder.calls).toContainEqual(["innerJoin", ["t1", "o1"]]);
		expect(builder.calls).toContainEqual(["leftJoin", ["t2", "o2"]]);
		expect(builder.calls).toContainEqual(["rightJoin", ["t3", "o3"]]);
		expect(builder.calls).toContainEqual(["fullJoin", ["t4", "o4"]]);
	});

	it("ignores an unknown join type", async () => {
		await getPaginatedRecords({
			table: {},
			skip: 0,
			take: 1,
			order: "O" as never,
			joins: [{ type: "cross" as never, table: "t", on: "o" as never }],
		});

		expect(methods()).not.toContain("crossJoin");
	});
});

describe("getPaginatedCount", () => {
	beforeEach(() => {
		builder.calls.length = 0;
	});

	it("returns the count from the first row", async () => {
		builder.setResult([{ count: 7 }]);

		expect(await getPaginatedCount({ table: {} })).toBe(7);
		expect(db.select).toHaveBeenLastCalledWith({ count: "COUNT(*)" });
	});

	it("applies joins and filter so counts match the listed records", async () => {
		builder.setResult([{ count: 0 }]);

		await getPaginatedCount({
			table: {},
			where: "W" as never,
			joins: [{ type: "left", table: "t", on: "o" as never }],
		});

		expect(builder.calls).toContainEqual(["leftJoin", ["t", "o"]]);
		expect(builder.calls).toContainEqual(["where", ["W"]]);
	});
});
