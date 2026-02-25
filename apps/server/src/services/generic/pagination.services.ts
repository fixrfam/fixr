import {
	count,
	db,
	getTableColumns,
	type MySqlTable,
	type SQL,
} from "@fixr/db/connection";

interface Join {
	type: "inner" | "left" | "right" | "full";
	table: unknown;
	on: SQL;
}

/**
 * Fetches a paginated range of records from a given table.
 */
export async function getPaginatedRecords<T = unknown>({
	table,
	select,
	skip,
	take,
	where,
	order,
	joins,
}: {
	table: unknown;
	skip: number;
	take: number;
	select?: T;
	where?: SQL;
	joins?: Join[];
	order: SQL;
}) {
	const tableRef = table as MySqlTable;
	const baseQuery = db
		.select(select ?? getTableColumns(tableRef))
		.from(tableRef)
		.$dynamic();

	if (where) {
		baseQuery.where(where);
	}

	if (joins) {
		for (const join of joins) {
			const joinTable = join.table as MySqlTable;
			switch (join.type) {
				case "inner":
					baseQuery.innerJoin(joinTable, join.on);
					break;
				case "left":
					baseQuery.leftJoin(joinTable, join.on);
					break;
				case "right":
					baseQuery.rightJoin(joinTable, join.on);
					break;
				case "full":
					baseQuery.fullJoin(joinTable, join.on);
					break;
				default:
					break;
			}
		}
	}

	const query = baseQuery.orderBy(order).limit(take).offset(skip);

	// Cast the result to the expected type inferred from the select parameter (or table columns)
	return (await query) as unknown[];
}

/**
 * Counts the total number of records matching the given condition.
 */
export async function getPaginatedCount({
	table,
	where,
}: {
	table: unknown;
	where?: SQL;
}) {
	const tableRef = table as MySqlTable;
	const query = db.select({ count: count() }).from(tableRef).$dynamic();

	if (where) {
		query.where(where);
	}

	const [amount] = await query;
	return amount.count;
}
