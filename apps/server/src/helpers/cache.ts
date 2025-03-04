export const CACHE_TTL = 60 * 5;

export const userCacheKey = (userId: string): string => {
    return `user:${userId}`;
};
