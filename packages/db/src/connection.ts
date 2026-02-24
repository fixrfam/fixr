import { env } from "@fixr/env/db";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const poolConnection = mysql.createPool(env.DB_URL);

export const db = drizzle(poolConnection, { schema, mode: "default" });
