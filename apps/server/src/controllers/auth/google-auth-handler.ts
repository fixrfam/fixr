import { cookieKey } from "@fixr/constants/cookies";
import { env } from "@fixr/env/server";
import { jwtPayload } from "@fixr/schemas/auth";
import { OAuth2Client } from "google-auth-library";
import { signJWT } from "@/src/helpers/jwt";
import { apiResponse } from "@/src/helpers/response";
import { generateRefreshToken } from "@/src/helpers/tokens";
import {
	queryJWTPayloadByUserId,
	queryUserByEmail,
	updateUserWithGoogleData,
} from "@/src/services/auth.services";
import { setJWTCookie, setRefreshToken } from "@/src/services/tokens.services";

const GOOGLE_CREDS = {
	clientId: env.GOOGLE_AUTH_CLIENT_ID,
	clientSecret: env.GOOGLE_AUTH_CLIENT_SECRET,
	redirectUri: env.GOOGLE_AUTH_REDIRECT_URI,
};

const client = new OAuth2Client(GOOGLE_CREDS);

const errorCookieOptions = {
	path: "/",
	httpOnly: false,
	sameSite: "none" as const,
	secure: true,
};

export function googleLoginHandler() {
	const params = {
		client_id: GOOGLE_CREDS.clientId,
		redirect_uri: GOOGLE_CREDS.redirectUri,
		response_type: "code",
		scope: "openid email profile",
	};

	const query = new URLSearchParams(params).toString();
	return `https://accounts.google.com/o/oauth2/v2/auth?${query}`;
}

export async function googleCallbackHandler({
	code,
	cookie,
}: {
	code: string;
	cookie: Record<string, { value: string }>;
}): Promise<
	| { status: number; redirect: string }
	| { status: number; response: ReturnType<typeof apiResponse> }
> {
	if (!code) {
		return {
			status: 422,
			response: apiResponse({
				status: 422,
				error: "Unprocessable Entity",
				code: "missing_code",
				message: "Missing authorization code from Google",
				data: null,
			}),
		};
	}

	const authLoginUrl = `${env.FRONTEND_URL}/auth/login`;

	try {
		const { tokens } = await client.getToken(code);
		const idToken = tokens.id_token;

		if (!idToken) {
			return {
				status: 502,
				response: apiResponse({
					status: 502,
					error: "Bad Gateway",
					code: "missing_id_token",
					message: "No ID token returned from Google",
					data: null,
				}),
			};
		}

		const ticket = await client.verifyIdToken({
			idToken,
			audience: env.GOOGLE_AUTH_CLIENT_ID,
		});

		const payload = ticket.getPayload();

		if (!payload?.email) {
			(cookie as unknown as Record<string, unknown>)[
				cookieKey("googleAuthError")
			] = {
				value: "gacc_missing_email",
				...errorCookieOptions,
			};
			return { status: 302, redirect: authLoginUrl };
		}

		const user = await queryUserByEmail(payload.email.toLowerCase());

		if (!user) {
			(cookie as unknown as Record<string, unknown>)[
				cookieKey("googleAuthError")
			] = {
				value: "gacc_user_not_found",
				...errorCookieOptions,
			};
			return { status: 302, redirect: authLoginUrl };
		}

		if (!(user.verified && payload.email_verified)) {
			(cookie as unknown as Record<string, unknown>)[
				cookieKey("googleAuthError")
			] = {
				value: "gacc_email_not_verified",
				...errorCookieOptions,
			};
			return { status: 302, redirect: authLoginUrl };
		}

		await updateUserWithGoogleData({ userId: user.id, data: payload });
		const payloadJWT = await queryJWTPayloadByUserId(user.id);

		const token = await signJWT({ payload: jwtPayload.parse(payloadJWT) });
		const refreshToken = generateRefreshToken();

		await setRefreshToken(cookie, refreshToken, user.id);
		setJWTCookie(cookie, token);

		const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;
		return { status: 302, redirect: dashboardUrl };
	} catch (err) {
		console.error(err);
		return {
			status: 500,
			response: apiResponse({
				status: 500,
				error: "Internal Server Error",
				code: "google_auth_failed",
				message: "Failed to authenticate with Google",
				data: null,
			}),
		};
	}
}
