import { cookieKey } from "@fixr/constants/cookies";
import { type NextRequest, NextResponse } from "next/server";

// biome-ignore lint/suspicious/useAwait: <Needs to be async>
export async function GET(request: NextRequest) {
	const redirectUrl = new URL("/auth/login", request.url);
	const response = NextResponse.redirect(redirectUrl);

	const domain = redirectUrl.hostname;
	const isSecure = request.url.startsWith("https");
	const baseOptions = {
		path: "/",
		domain,
		secure: isSecure,
		sameSite: "none" as const,
		maxAge: 0,
	};

	response.cookies.set(cookieKey("session"), "", {
		...baseOptions,
		httpOnly: false,
	});

	response.cookies.set(cookieKey("refreshToken"), "", {
		...baseOptions,
		httpOnly: true,
	});

	return response;
}
