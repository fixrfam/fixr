import { env } from "@fixr/env/db";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const DB_URL = env.DB_URL;

const url = new URL(DB_URL);

const poolConnection = mysql.createPool({
	host: url.hostname,
	port: Number(url.port),
	user: url.username,
	password: url.password,
	database: url.pathname.slice(1),
	ssl: {},
	connectionLimit: 10,
});

export const db = drizzle(poolConnection, { schema, mode: "default" });

export * from "drizzle-orm";
export { MySqlTable } from "drizzle-orm/mysql-core";
