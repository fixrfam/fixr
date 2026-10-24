import {
	and,
	asc,
	db,
	desc,
	eq,
	gte,
	like,
	lte,
	or,
	type SQL,
	sql,
} from "@fixr/db/connection";
import { parts, suppliers } from "@fixr/db/schema";
import type { getPartsQuerySchema } from "@fixr/schemas/parts";
import type { z } from "zod";
import { Cached, InvalidateCache } from "../../../shared/infra/cache";

export type PartInsert = typeof parts.$inferInsert;

/** Part columns plus a summary of its supplier. */
export const partsListSelect = {
	id: parts.id,
	companyId: parts.companyId,
	supplierId: parts.supplierId,
	sku: parts.sku,
	name: parts.name,
	description: parts.description,
	category: parts.category,
	costPrice: parts.costPrice,
	salePrice: parts.salePrice,
	stock: parts.stock,
	minStock: parts.minStock,
	createdAt: parts.createdAt,
	updatedAt: parts.updatedAt,
	supplier: { id: suppliers.id, name: suppliers.name },
};

export const partsListJoins = [
	{
		type: "inner" as const,
		table: suppliers,
		on: eq(suppliers.id, parts.supplierId),
	},
];

/** @description Data access layer for parts */
export class PartsRepository {
	static buildListFilter(
		companyId: string,
		filters: Pick<
			z.infer<typeof getPartsQuerySchema>,
			"query" | "category" | "supplierId" | "lowStock"
		>
	) {
		const conditions: SQL[] = [eq(parts.companyId, companyId)];

		if (filters.category) {
			conditions.push(eq(parts.category, filters.category));
		}
		if (filters.supplierId) {
			conditions.push(eq(parts.supplierId, filters.supplierId));
		}
		if (filters.lowStock === "true") {
			conditions.push(lte(parts.stock, parts.minStock));
		}
		if (filters.query) {
			conditions.push(
				or(
					like(parts.name, `%${filters.query}%`),
					like(parts.sku, `%${filters.query}%`)
				)!
			);
		}

		return and(...conditions);
	}

	static buildOrder(sort?: "newer" | "older" | "name") {
		if (sort === "name") {
			return asc(parts.name);
		}
		return sort === "older" ? asc(parts.createdAt) : desc(parts.createdAt);
	}

	@Cached({ ttl: 3600, key: "parts:id" })
	static async queryPartById(partId: string) {
		const [part] = await db
			.select(partsListSelect)
			.from(parts)
			.innerJoin(suppliers, eq(suppliers.id, parts.supplierId))
			.where(eq(parts.id, partId))
			.limit(1);
		return part ?? null;
	}

	static async queryPartBySku(companyId: string, sku: string) {
		const [part] = await db
			.select({ id: parts.id })
			.from(parts)
			.where(and(eq(parts.companyId, companyId), eq(parts.sku, sku)))
			.limit(1);
		return part ?? null;
	}

	static async querySupplierOfCompany(supplierId: string, companyId: string) {
		const [supplier] = await db
			.select({ id: suppliers.id })
			.from(suppliers)
			.where(
				and(eq(suppliers.id, supplierId), eq(suppliers.companyId, companyId))
			)
			.limit(1);
		return supplier ?? null;
	}

	@InvalidateCache({ patterns: ["parts:*", "services:*"] })
	static async insertPart(values: PartInsert) {
		const [inserted] = await db.insert(parts).values(values).$returningId();
		return inserted.id;
	}

	@InvalidateCache({ patterns: ["parts:*", "services:*"] })
	static async updatePart(partId: string, values: Partial<PartInsert>) {
		await db.update(parts).set(values).where(eq(parts.id, partId));
	}

	/**
	 * Add `delta` (negative to remove) to the stock in one statement, so
	 * concurrent adjustments can't overwrite each other. Returns `false` when
	 * the result would be negative and nothing was changed.
	 */
	@InvalidateCache({ patterns: ["parts:*", "services:*"] })
	static async adjustStock(partId: string, delta: number) {
		const [result] = await db
			.update(parts)
			.set({ stock: sql`${parts.stock} + ${delta}` })
			.where(and(eq(parts.id, partId), gte(sql`${parts.stock} + ${delta}`, 0)));
		return result.affectedRows > 0;
	}

	@InvalidateCache({ patterns: ["parts:*", "services:*"] })
	static async deletePart(partId: string) {
		await db.delete(parts).where(eq(parts.id, partId));
	}
}
