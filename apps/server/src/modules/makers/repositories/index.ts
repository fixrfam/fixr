import { and, asc, db, desc, eq, like, type SQL } from "@fixr/db/connection";
import { modelMakers } from "@fixr/db/schema";

/** @description Column selection for paginated makers list */
export const makersListSelect = {
	id: modelMakers.id,
	name: modelMakers.name,
	slug: modelMakers.slug,
	url: modelMakers.url,
	deviceCount: modelMakers.deviceCount,
	pageCount: modelMakers.pageCount,
	createdAt: modelMakers.createdAt,
};

/** @description Data access layer for device makers */
export class MakersRepository {
	/**
	 * Build a WHERE clause for filtering makers
	 *
	 * @param query - Optional name filter
	 */
	static buildListFilter(query?: string) {
		const conditions: SQL[] = [];
		if (query) {
			conditions.push(like(modelMakers.name, `%${query}%`));
		}
		return conditions.length > 0 ? and(...conditions) : undefined;
	}

	/**
	 * Build an ORDER BY clause for makers
	 *
	 * @param sort - Sort key: newer, older, name, most_devices
	 */
	static buildOrder(sort?: string) {
		switch (sort) {
			case "newer":
				return desc(modelMakers.createdAt);
			case "older":
				return asc(modelMakers.createdAt);
			case "most_devices":
				return desc(modelMakers.deviceCount);
			default:
				return asc(modelMakers.name);
		}
	}

	/**
	 * Find a maker by its slug
	 *
	 * @param slug - The maker slug
	 * @returns The maker record or null
	 */
	static async queryMakerBySlug(slug: string) {
		const [maker] = await db
			.select()
			.from(modelMakers)
			.where(eq(modelMakers.slug, slug))
			.limit(1);
		return maker ?? null;
	}
}
