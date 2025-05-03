import { db } from "@repo/db/connection";
import { count, SQL } from "drizzle-orm";
import { MySqlTable } from "drizzle-orm/mysql-core";

/**
 * Fetches a paginated range of records from a given table.
 */
export async function getPaginatedRecords({
    table,
    skip,
    take,
    where,
    order,
}: {
    table: MySqlTable;
    skip: number;
    take: number;
    where?: SQL;
    order: SQL;
}) {
    return await db.select().from(table).where(where).orderBy(order).limit(take).offset(skip);
}

/**
 * Counts the total number of records matching the given condition.
 */
export async function getPaginatedCount({ table, where }: { table: MySqlTable; where?: SQL }) {
    const [amount] = await db.select({ count: count() }).from(table).where(where);
    return amount.count;
}
