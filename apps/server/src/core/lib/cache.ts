/** @description Cache TTL in seconds (1 hour) */
export const CACHE_TTL = 60 * 60;

/** @description Build cache key for a user record */
export const userCacheKey = (userId: string): string => {
	return `user:${userId}`;
};

/** @description Build cache key for an account record */
export const accountCacheKey = (userId: string): string => {
	return `account:${userId}`;
};

/** @description Build cache key for a JWT payload record */
export const jwtPayloadCacheKey = (userId: string): string => {
	return `jwtPayload:${userId}`;
};

/** @description Build cache key for a company record */
export const companyCacheKey = (companyId: string): string => {
	return `company:${companyId}`;
};
