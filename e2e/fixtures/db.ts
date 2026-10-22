import { createId } from "@paralleldrive/cuid2";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import { DB_URL } from "../support/env";
import { COMPANY_A, COMPANY_B, PASSWORD } from "./data";

export async function withDb<T>(fn: (db: mysql.Connection) => Promise<T>) {
	const connection = await mysql.createConnection({ uri: DB_URL });
	try {
		return await fn(connection);
	} finally {
		await connection.end();
	}
}

/** Empty every table: each e2e run starts from the same state. */
export async function resetDatabase() {
	await withDb(async (db) => {
		const [rows] = await db.query(
			"SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'"
		);
		await db.query("SET FOREIGN_KEY_CHECKS = 0");
		for (const { name } of rows as { name: string }[]) {
			if (name !== "__drizzle_migrations") {
				await db.query(`TRUNCATE TABLE \`${name}\``);
			}
		}
		await db.query("SET FOREIGN_KEY_CHECKS = 1");
	});
}

/** Insert the two tenant companies and their admins (see fixtures/data.ts). */
export async function seedCompanies() {
	const hash = bcrypt.hashSync(PASSWORD, 10);
	await withDb(async (db) => {
		for (const company of [COMPANY_A, COMPANY_B]) {
			const companyId = createId();
			const userId = createId();
			await db.query(
				"INSERT INTO companies (id, name, cnpj, subdomain) VALUES (?, ?, ?, ?)",
				[companyId, company.name, company.cnpj, company.subdomain]
			);
			await db.query(
				"INSERT INTO users (id, email, password_hash, verified) VALUES (?, ?, ?, true)",
				[userId, company.admin.email, hash]
			);
			await db.query(
				// The drizzle enum is declared as mysqlEnum("roles", ...), so the column is `roles`.
				"INSERT INTO employees (id, name, cpf, roles, user_id, company_id) VALUES (?, ?, ?, 'admin', ?, ?)",
				[createId(), company.admin.name, company.admin.cpf, userId, companyId]
			);
		}
	});
}

/** Latest one-time token of a type for an email (tests read what the API stored). */
export async function latestToken(
	email: string,
	type: "confirmation" | "password_reset" | "account_deletion"
) {
	return await withDb(async (db) => {
		const [rows] = await db.query(
			"SELECT token FROM one_time_tokens WHERE relates_to = ? AND ott_type = ? ORDER BY created_at DESC LIMIT 1",
			[email, type]
		);
		return (rows as { token: string }[])[0]?.token ?? null;
	});
}

/** Create an unverified client account plus a confirmation token for it. */
export async function createUnverifiedAccount(email: string) {
	return await withDb(async (db) => {
		const userId = createId();
		const token = `${createId()}${createId()}`;
		await db.query(
			"INSERT INTO users (id, email, password_hash, verified) VALUES (?, ?, ?, false)",
			[userId, email, bcrypt.hashSync(PASSWORD, 10)]
		);
		await db.query(
			"INSERT INTO clients (id, name, cpf, user_id) VALUES (?, ?, ?, ?)",
			[
				createId(),
				"Cliente Não Verificado",
				String(Date.now()).slice(-11).padStart(11, "0"),
				userId,
			]
		);
		await db.query(
			"INSERT INTO one_time_tokens (id, token, ott_type, relates_to, user_id, expires_at) VALUES (?, ?, 'confirmation', ?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))",
			[createId(), token, email, userId]
		);
		return token;
	});
}
