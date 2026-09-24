import type { RouteRule } from "./routes";

type Nullable<T> = T | null;

interface RouteMatch {
	rule: RouteRule;
	params: Record<string, string>;
}

interface RouteMatcher {
	/** Matches the pattern itself (optionally with a trailing slash). */
	exact: RegExp;
	/** Matches the pattern or anything nested below it. */
	prefix: RegExp;
	paramNames: string[];
}

function convertPatternToRegex(pattern: string): RouteMatcher {
	const paramNames: string[] = [];
	const regexPattern = pattern.replace(/:([^/]+)/g, (_, paramName) => {
		paramNames.push(paramName);
		return "([^/]+)";
	});

	return {
		exact: new RegExp(`^${regexPattern}/?$`),
		prefix: new RegExp(`^${regexPattern}(/.*)?$`),
		paramNames,
	};
}

const routeCache = new Map<string, RouteMatcher>();

const QUERY_OR_HASH_REGEX = /[?#]/;

function getRouteMatcher(pattern: string) {
	if (!routeCache.has(pattern)) {
		routeCache.set(pattern, convertPatternToRegex(pattern));
	}
	return routeCache.get(pattern)!;
}

function findMatch(
	pathname: string,
	rules: RouteRule[],
	kind: "exact" | "prefix"
): Nullable<RouteMatch> {
	for (const rule of rules) {
		const matcher = getRouteMatcher(rule.path);
		const match = matcher[kind].exec(pathname);

		if (match) {
			const params: Record<string, string> = {};
			matcher.paramNames.forEach((name, index) => {
				const value = match[index + 1];
				if (value !== undefined) {
					params[name] = value;
				}
			});

			return { rule, params };
		}
	}

	return null;
}

/**
 * Find the rule for a pathname. An exact match always wins over a prefix
 * match, so `/service-orders/new` gets its own rule (serviceOrders:create)
 * instead of the `/service-orders` one (serviceOrders:read) listed before it.
 */
export function matchRoute(
	pathname: string,
	rules: RouteRule[]
): Nullable<RouteMatch> {
	const path = pathname.split(QUERY_OR_HASH_REGEX)[0] ?? pathname;
	return findMatch(path, rules, "exact") ?? findMatch(path, rules, "prefix");
}

export function isPublicRoute(pathname: string, rules: RouteRule[]): boolean {
	const match = matchRoute(pathname, rules);
	return match?.rule.public ?? false;
}

export function getRequiredPermission(
	pathname: string,
	rules: RouteRule[]
): Nullable<string> {
	const match = matchRoute(pathname, rules);
	if (!match) {
		return null;
	}
	if (match.rule.permission === undefined) {
		return null;
	}
	return match.rule.permission;
}

export function getRequiredRoles(
	pathname: string,
	rules: RouteRule[]
): Nullable<readonly string[]> {
	const match = matchRoute(pathname, rules);
	if (!match) {
		return null;
	}
	if (match.rule.roles === undefined) {
		return null;
	}
	return match.rule.roles;
}
