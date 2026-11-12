import { customType } from "drizzle-orm/mysql-core";

/**
 * `DECIMAL(precision, scale)` read back as a JS number.
 *
 * mysql2 returns DECIMAL columns as strings (and drizzle-orm 0.38 has no
 * number mode for `decimal()`), so numeric columns go through this type to
 * keep the API contract numeric.
 */
const decimalNumber = (precision: number, scale: number) =>
	customType<{ data: number; driverData: string }>({
		dataType() {
			return `decimal(${precision}, ${scale})`;
		},
		fromDriver(value) {
			return Number(value);
		},
		toDriver(value) {
			return value.toFixed(scale);
		},
	});

/** Monetary amount in BRL, `DECIMAL(10, 2)`. */
export const money = decimalNumber(10, 2);

/** Percentage from 0 to 100 with two decimals, `DECIMAL(5, 2)`. */
export const percentage = decimalNumber(5, 2);
