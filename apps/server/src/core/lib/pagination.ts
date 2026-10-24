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

	return (await query) as unknown[];
}

export async function getPaginatedCount({
	table,
	where,
	joins,
}: {
	table: unknown;
	where?: SQL;
	joins?: Join[];
}) {
	const tableRef = table as MySqlTable;
	const query = db.select({ count: count() }).from(tableRef).$dynamic();

	if (joins) {
		for (const join of joins) {
			const joinTable = join.table as MySqlTable;
			switch (join.type) {
				case "inner":
					query.innerJoin(joinTable, join.on);
					break;
				case "left":
					query.leftJoin(joinTable, join.on);
					break;
				case "right":
					query.rightJoin(joinTable, join.on);
					break;
				case "full":
					query.fullJoin(joinTable, join.on);
					break;
				default:
					break;
			}
		}
	}

	if (where) {
		query.where(where);
	}

	const [amount] = await query;
	return amount.count;
}

/**
 * Pagination block for a paginated response.
 *
 * Returns `null` when `page` is past the last page so the caller can throw its
 * module's `*_PAGE_OUT_OF_BOUNDS` error. An empty result is always page 1 of 0.
 */
export function paginationMeta({
	page,
	perPage,
	totalRecords,
	recordsOnPage,
}: {
	page: number;
	perPage: number;
	totalRecords: number;
	recordsOnPage: number;
}) {
	if (totalRecords === 0) {
		return {
			total_records: 0,
			total_pages: 0,
			current_page: 1,
			next_page: null,
			prev_page: null,
		};
	}

	const totalPages = Math.ceil(totalRecords / perPage);

	if (page > totalPages) {
		return null;
	}

	return {
		total_records: totalRecords,
		total_pages: totalPages,
		current_page: page,
		next_page:
			perPage * (page - 1) + recordsOnPage < totalRecords ? page + 1 : null,
		prev_page: page > 1 ? page - 1 : null,
	};
}
