import {
	and,
	asc,
	count,
	db,
	desc,
	eq,
	like,
	or,
	type SQL,
} from "@fixr/db/connection";
import { parts, suppliers } from "@fixr/db/schema";
import { Cached, InvalidateCache } from "../../../shared/infra/cache";

export type SupplierInsert = typeof suppliers.$inferInsert;

/** @description Data access layer for suppliers */
export class SuppliersRepository {
	/**
	 * Build the WHERE clause for listing a company's suppliers
	 *
	 * @param companyId - Tenant the suppliers belong to
	 * @param query - Optional search on name, CNPJ and contact
	 */
	static buildListFilter(companyId: string, query?: string) {
		const conditions: SQL[] = [eq(suppliers.companyId, companyId)];

		if (query) {
			conditions.push(
				or(
					like(suppliers.name, `%${query}%`),
					like(suppliers.cnpj, `%${query}%`),
					like(suppliers.contact, `%${query}%`)
				)!
			);
		}

		return and(...conditions);
	}

	static buildOrder(sort?: "newer" | "older" | "name") {
		if (sort === "name") {
			return asc(suppliers.name);
		}
		return sort === "older"
			? asc(suppliers.createdAt)
			: desc(suppliers.createdAt);
	}

	@Cached({ ttl: 3600, key: "suppliers:id" })
	static async querySupplierById(supplierId: string) {
		const [supplier] = await db
			.select()
			.from(suppliers)
			.where(eq(suppliers.id, supplierId))
			.limit(1);
		return supplier ?? null;
	}

	static async querySupplierByCnpj(companyId: string, cnpj: string) {
		const [supplier] = await db
			.select({ id: suppliers.id })
			.from(suppliers)
			.where(and(eq(suppliers.companyId, companyId), eq(suppliers.cnpj, cnpj)))
			.limit(1);
		return supplier ?? null;
	}

	static async countPartsBySupplier(supplierId: string) {
		const [result] = await db
			.select({ count: count() })
			.from(parts)
			.where(eq(parts.supplierId, supplierId));
		return result?.count ?? 0;
	}

	@InvalidateCache({ patterns: ["suppliers:*"] })
	static async insertSupplier(values: SupplierInsert) {
		const [inserted] = await db.insert(suppliers).values(values).$returningId();
		return inserted.id;
	}

	// Parts embed their supplier's name, so their cached reads go stale too.
	@InvalidateCache({ patterns: ["suppliers:*", "parts:*"] })
	static async updateSupplier(
		supplierId: string,
		values: Partial<SupplierInsert>
	) {
		await db.update(suppliers).set(values).where(eq(suppliers.id, supplierId));
	}

	@InvalidateCache({ patterns: ["suppliers:*"] })
	static async deleteSupplier(supplierId: string) {
		await db.delete(suppliers).where(eq(suppliers.id, supplierId));
	}
}
