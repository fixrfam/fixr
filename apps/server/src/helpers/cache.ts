export const CACHE_TTL = 60 * 60; //1 hour

export const userCacheKey = (userId: string): string => {
    return `user:${userId}`;
};

export const accountCacheKey = (userId: string): string => {
    return `account:${userId}`;
};

export const jwtPayloadCacheKey = (userId: string): string => {
    return `jwtPayload:${userId}`;
};

export const companyCacheKey = (companyId: string): string => {
    return `company:${companyId}`;
};
