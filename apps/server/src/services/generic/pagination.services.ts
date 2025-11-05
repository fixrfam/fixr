import { db } from "@fixr/db/connection"
import { count, getTableColumns, SQL } from "drizzle-orm"
import { AnyMySqlColumn, MySqlTable } from "drizzle-orm/mysql-core"

type Join = {
  type: "inner" | "left" | "right" | "full"
  table: MySqlTable
  on: SQL
}

/**
 * Fetches a paginated range of records from a given table.
 */
export async function getPaginatedRecords({
  table,
  select,
  skip,
  take,
  where,
  order,
  joins,
}: {
  table: MySqlTable
  skip: number
  take: number
  select?: Record<string, AnyMySqlColumn | SQL | Record<string, AnyMySqlColumn>>
  where?: SQL
  joins?: Join[]
  order: SQL
}) {
  const baseQuery = db
    .select(select ?? getTableColumns(table))
    .from(table)
    .where(where)
    .orderBy(order)

  if (joins) {
    for (const join of joins) {
      switch (join.type) {
        case "inner":
          baseQuery.innerJoin(join.table, join.on)
          break
        case "left":
          baseQuery.leftJoin(join.table, join.on)
          break
        case "right":
          baseQuery.rightJoin(join.table, join.on)
          break
        case "full":
          baseQuery.fullJoin(join.table, join.on)
          break
      }
    }
  }

  const query = baseQuery.limit(take).offset(skip)

  return await query
}

/**
 * Counts the total number of records matching the given condition.
 */
export async function getPaginatedCount({
  table,
  where,
}: {
  table: MySqlTable
  where?: SQL
}) {
  const [amount] = await db.select({ count: count() }).from(table).where(where)
  return amount.count
}
