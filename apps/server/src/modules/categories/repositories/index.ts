import { asc, db, eq, like } from "@fixr/db/connection";
import { modelCategories } from "@fixr/db/schema";

/** @description Data access layer for device categories */
export class CategoriesRepository {
	/**
	 * Query all categories, optionally filtering by name
	 *
	 * @param query - Optional name filter
	 */
	static async queryAllCategories(query?: string) {
		const base = db.select().from(modelCategories).$dynamic();
		if (query) {
			base.where(like(modelCategories.name, `%${query}%`));
		}
		return await base.orderBy(asc(modelCategories.name));
	}

	/**
	 * Find a category by its slug
	 *
	 * @param slug - The category slug
	 * @returns The category record or null
	 */
	static async queryCategoryBySlug(slug: string) {
		const [category] = await db
			.select()
			.from(modelCategories)
			.where(eq(modelCategories.slug, slug))
			.limit(1);
		return category ?? null;
	}
}
