import { env } from "@fixr/env/server";

/**
 * Public origin of this API. Links sent by email are built from it, never from
 * the request's `Host`, which the client controls.
 */
const apiOrigin = new URL(env.API_URL ?? env.GOOGLE_AUTH_REDIRECT_URI).origin;

const TRAILING_SLASH = /\/$/;

/** Absolute URL of an API path, e.g. `apiUrl("/auth/verify")`. */
export function apiUrl(path: string) {
	return new URL(path, apiOrigin).toString();
}

/**
 * Where to send the browser after an emailed link: `target` only when it is on
 * the frontend's origin, otherwise the login page. Keeps those links from
 * redirecting to another site.
 */
export function frontendRedirect(target: string | undefined) {
	const fallback = `${env.FRONTEND_URL.replace(TRAILING_SLASH, "")}/auth/login`;
	if (!target) {
		return fallback;
	}
	try {
		const url = new URL(target, env.FRONTEND_URL);
		return url.origin === new URL(env.FRONTEND_URL).origin
			? url.toString()
			: fallback;
	} catch {
		return fallback;
	}
}
