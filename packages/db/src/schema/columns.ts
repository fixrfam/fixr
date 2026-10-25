import { customType } from "drizzle-orm/mysql-core";

/**
 * Monetary amount stored as `DECIMAL(10, 2)` and read back as a JS number.
 *
 * mysql2 returns DECIMAL columns as strings (and drizzle-orm 0.38 has no
 * number mode for `decimal()`), so every money column goes through this type
 * to keep the API contract numeric.
 */
export const money = customType<{ data: number; driverData: string }>({
	dataType() {
		return "decimal(10, 2)";
	},
	fromDriver(value) {
		return Number(value);
	},
	toDriver(value) {
		return value.toFixed(2);
	},
});
