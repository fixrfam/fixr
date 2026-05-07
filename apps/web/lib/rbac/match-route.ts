import type { RouteRule } from "./routes";

type Nullable<T> = T | null;

interface RouteMatch {
	rule: RouteRule;
	params: Record<string, string>;
}

function convertPatternToRegex(pattern: string): {
	regex: RegExp;
	paramNames: string[];
} {
	const paramNames: string[] = [];
	const regexPattern = pattern.replace(/:([^/]+)/g, (_, paramName) => {
		paramNames.push(paramName);
		return "([^/]+)";
	});

	return {
		regex: new RegExp(`^${regexPattern}(/.*)?$`),
		paramNames,
	};
}

const routeCache = new Map<string, { regex: RegExp; paramNames: string[] }>();

function getRouteMatcher(pattern: string) {
	if (!routeCache.has(pattern)) {
		routeCache.set(pattern, convertPatternToRegex(pattern));
	}
	return routeCache.get(pattern)!;
}

export function matchRoute(
	pathname: string,
	rules: RouteRule[]
): Nullable<RouteMatch> {
	for (const rule of rules) {
		const { regex, paramNames } = getRouteMatcher(rule.path);
		const match = regex.exec(pathname);

		if (match) {
			const params: Record<string, string> = {};
			paramNames.forEach((name, index) => {
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
