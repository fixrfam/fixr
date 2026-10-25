import { db, sql } from "@fixr/db/connection";
import { redis } from "@/src/config/redis";

const MIGRATIONS_TABLE = "__drizzle_migrations";

let tableNames: string[] | undefined;

async function listTables() {
	if (!tableNames) {
		const [rows] = (await db.execute(
			sql`SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'`
		)) as unknown as [{ name: string }[]];
		tableNames = rows
			.map((row) => row.name)
			.filter((name) => name !== MIGRATIONS_TABLE);
	}
	return tableNames;
}

/**
 * Empties every table (keeping the migrations journal) and flushes Redis.
 * TRUNCATE with FOREIGN_KEY_CHECKS=0 is more predictable than wrapping each
 * test in a transaction, because the app uses a connection pool.
 */
export async function truncateAll() {
	const tables = await listTables();
	const connection = await db.$client.getConnection();
	try {
		await connection.query("SET FOREIGN_KEY_CHECKS = 0");
		for (const table of tables) {
			await connection.query(`TRUNCATE TABLE \`${table}\``);
		}
		await connection.query("SET FOREIGN_KEY_CHECKS = 1");
	} finally {
		connection.release();
	}
}

export async function resetState() {
	await Promise.all([truncateAll(), redis.flushdb()]);
}

export async function closeConnections() {
	await Promise.allSettled([db.$client.end(), redis.quit()]);
}
