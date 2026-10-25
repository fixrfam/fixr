import { cookieKey } from "@fixr/constants/cookies";

/** base64url of the UTF-8 JSON, like a real JWT segment. */
const base64url = (value: object) =>
	btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))
		.replace(/=+$/, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");

/** An unsigned JWT with the API's payload shape (the web app never verifies signatures). */
export function fakeJwt(overrides: Record<string, unknown> = {}) {
	const now = Math.floor(Date.now() / 1000);
	const payload = {
		id: "ckx1y2z3a4b5c6d7e8f9g0h1",
		email: "maria@fixr.test",
		displayName: "Maria",
		avatarUrl: null,
		profileType: "employee",
		company: {
			id: "ckx1y2z3a4b5c6d7e8f9g0h2",
			name: "Fixr",
			subdomain: "fixr",
			role: "manager",
		},
		createdAt: "2024-01-01T00:00:00.000Z",
		iat: now,
		exp: now + 300,
		...overrides,
	};
	return `${base64url({ alg: "HS256", typ: "JWT" })}.${base64url(payload)}.signature`;
}

/** Put a session cookie in jsdom's document.cookie. */
export function setSessionCookie(token: string) {
	document.cookie = `${cookieKey("session")}=${token}; path=/`;
}
