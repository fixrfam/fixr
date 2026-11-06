import { db, type Transaction } from "@fixr/db/connection";

/**
 * Run `work` in a database transaction: writes made through `tx` (the
 * repositories' and the effects of the events emitted with it) commit
 * together or not at all.
 */
export function inTransaction<T>(work: (tx: Transaction) => Promise<T>) {
	return db.transaction(work);
}
