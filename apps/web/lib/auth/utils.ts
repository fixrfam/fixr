import { cookieKey } from "@fixr/constants/cookies";
import { userJWT } from "@fixr/schemas/auth";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { parseCookies } from "nookies";
import { parseJwt } from "../utils";
import { axios } from "./axios";

export function emailDisplayName(email: string) {
	return email.split("@")[0];
}

export async function signOut(cookieString?: string) {
	return cookieString
		? await axios.get("/auth/signout", { headers: { Cookie: cookieString } })
		: await axios.get("/auth/signout");
}

export function getSession(
	cookies?: ReadonlyRequestCookies
): ReturnType<typeof userJWT.parse> | null {
	const jwt = cookies
		? parseJwt(cookies.get(cookieKey("session"))?.value)
		: parseJwt(parseCookies()[cookieKey("session")]);

	// Missing/expired sessions are expected (the middleware revalidates the token
	// before this runs); fail gracefully to null instead of throwing a ZodError.
	const result = userJWT.safeParse(jwt);
	return result.success ? result.data : null;
}

export const getClientSession = (): ReturnType<typeof userJWT.parse> | null => {
	const cookies = parseCookies();

	const raw = cookies[cookieKey("session")];
	if (!raw) {
		return null;
	}

	try {
		const jwt = parseJwt(raw);
		return userJWT.parse(jwt);
	} catch {
		return null;
	}
};
