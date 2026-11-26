import { cookieKey } from "@fixr/constants/cookies";
import { env } from "@fixr/env/web";
import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIES = [cookieKey("session"), cookieKey("refreshToken")];

// biome-ignore lint/suspicious/useAwait: <Needs to be async>
export async function GET(request: NextRequest) {
	const redirectUrl = new URL("/auth/login", request.url);
	const response = NextResponse.redirect(redirectUrl);

	/**
	 * The API sets these cookies with a `Domain` (COOKIE_DOMAIN), and a browser
	 * only drops a cookie when the deletion names the same domain. Clear both the
	 * host-only and the domain-scoped variants so the session really ends.
	 */
	const domain = new URL(env.NEXT_PUBLIC_APP_URL).hostname;
	for (const name of SESSION_COOKIES) {
		const expired = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=None`;
		response.headers.append("Set-Cookie", expired);
		response.headers.append("Set-Cookie", `${expired}; Domain=${domain}`);
	}

	return response;
}
