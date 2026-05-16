import { APP_NAME } from "@fixr/constants/app";
import { cookieKey } from "@fixr/constants/cookies";
import { env } from "@fixr/env/server";
import {
	emailDisplayName,
	sendAccountVerificationEmail,
} from "@fixr/mail/services";
import { jwtPayload } from "@fixr/schemas/auth";
import bcrypt from "bcrypt";
import type { Context } from "elysia";
import { OAuth2Client } from "google-auth-library";
import { AppError } from "../../../core/lib/app-error";
import { hashPassword } from "../../../core/lib/hash-password";
import { signJWT } from "../../../core/lib/jwt";
import { apiResponse } from "../../../core/lib/response";
import { generateRefreshToken } from "../../../core/lib/tokens";
import { TokensRepository } from "../../tokens/repositories";
import { TokensService } from "../../tokens/services";
import { AuthRepository } from "../repositories";

const GOOGLE_CREDS = {
	clientId: env.GOOGLE_AUTH_CLIENT_ID,
	clientSecret: env.GOOGLE_AUTH_CLIENT_SECRET,
	redirectUri: env.GOOGLE_AUTH_REDIRECT_URI,
};

const client = new OAuth2Client(GOOGLE_CREDS);

export class AuthService {
	static async register({
		body,
		_request,
		ctx,
	}: {
		body: { email: string; displayName?: string; password: string };
		_request: Context;
		ctx: Context;
	}) {
		const email = body.email.toLowerCase();
		const existingEmail = await AuthRepository.queryUserByEmail(email);

		if (existingEmail) {
			throw new AppError("AUTH_EMAIL_ALREADY_USED");
		}

		const hashedPassword = await hashPassword(body.password);

		const newUser = await AuthRepository.createUser({
			displayName: body.displayName,
			email,
			passwordHash: hashedPassword,
		});

		const oneTimeToken = await TokensService.createOneTimeToken({
			email: newUser.email,
			userId: newUser.id,
			tokenType: "confirmation",
		});

		const redirectUrl = `${env.FRONTEND_URL}/auth/login`;

		const reqUrl = new URL(ctx.request.url);
		const verificationUrl = `${reqUrl.protocol}//${reqUrl.host}/auth/verify?token=${encodeURIComponent(oneTimeToken.token)}&redirectUrl=${encodeURIComponent(redirectUrl)}`;

		await sendAccountVerificationEmail({
			to: newUser.email,
			appName: APP_NAME,
			verificationUrl,
			displayName: newUser.displayName ?? emailDisplayName(newUser.email),
		}).catch(async () => {
			await AuthRepository.deleteUser(newUser.id);

			throw new AppError("AUTH_VERIFICATION_EMAIL_FAILED");
		});

		ctx.set.status = 201;
		return apiResponse({
			status: 201,
			error: null,
			code: "user_registered_success",
			message: "User registered successfully",
			data: null,
		});
	}

	static async login({
		body,
		ctx,
	}: {
		body: { email: string; password: string };
		ctx: Context;
	}) {
		const email = body.email.toLowerCase();

		const user = await AuthRepository.queryUserByEmail(email);

		if (!user) {
			throw new AppError("AUTH_USER_NOT_FOUND");
		}

		if (!user.verified) {
			throw new AppError("AUTH_EMAIL_NOT_VERIFIED");
		}

		const validPassword = await bcrypt.compare(
			body.password,
			user.passwordHash
		);

		if (!validPassword) {
			throw new AppError("AUTH_INVALID_PASSWORD");
		}

		const payload = await AuthRepository.queryJWTPayloadByUserId(user.id);

		const token = signJWT({
			payload: jwtPayload.parse(payload),
		});

		const refreshToken = generateRefreshToken();
		await TokensService.setRefreshToken(ctx, refreshToken, user.id);
		TokensService.setJWTCookie(ctx, token);

		ctx.set.status = 200;
		return apiResponse({
			status: 200,
			error: null,
			code: "login_success",
			message: "Logged in successfully",
			data: {
				token,
			},
		});
	}

	static async verify({
		token,
		redirectUrl,
		ctx,
	}: {
		token: string;
		redirectUrl?: string;
		ctx: Context;
	}) {
		const oneTimeToken = await TokensRepository.queryOneTimeToken(token);

		if (!oneTimeToken) {
			throw new AppError("AUTH_TOKEN_NOT_FOUND");
		}
		if (oneTimeToken.expiresAt < new Date()) {
			throw new AppError("AUTH_TOKEN_EXPIRED");
		}
		if (oneTimeToken.tokenType !== "confirmation") {
			throw new AppError("AUTH_INVALID_TOKEN");
		}

		const verifyUser = AuthRepository.setUserVerified(oneTimeToken.user.id);
		const deleteToken = TokensRepository.deleteOneTimeToken(oneTimeToken.token);
		await Promise.all([verifyUser, deleteToken]);

		if (redirectUrl) {
			ctx.cookie[cookieKey("showVerifiedDialog")]?.set({
				value: "true",
				path: "/",
				httpOnly: false,
				sameSite: "none",
				secure: true,
			});
			ctx.set.status = 302;
			ctx.set.redirect = decodeURIComponent(redirectUrl);
			return;
		}

		ctx.set.status = 200;
		return apiResponse({
			status: 200,
			error: null,
			code: "email_verify_success",
			message: "Email verified successfully",
			data: null,
		});
	}

	static async signOut({
		refreshToken,
		ctx,
	}: {
		refreshToken: string | undefined;
		ctx: Context;
	}) {
		if (!refreshToken) {
			throw new AppError("AUTH_NO_REFRESH_PROVIDED");
		}

		const tokenData = await TokensRepository.queryTokenData(refreshToken);

		if (!tokenData) {
			throw new AppError("AUTH_INVALID_REFRESH");
		}

		if (tokenData.expiresAt < new Date()) {
			throw new AppError("AUTH_REFRESH_EXPIRED");
		}

		const user = tokenData.user;

		if (!user) {
			throw new AppError("AUTH_USER_NOT_FOUND");
		}

		await TokensRepository.deleteRefreshToken(tokenData.token);

		ctx.set.status = 200;
		return apiResponse({
			status: 200,
			error: null,
			code: "signout_success",
			message: "User signed out successfully",
			data: null,
		});
	}

	static async revalidate({
		refreshToken,
		ctx,
	}: {
		refreshToken: string | undefined;
		ctx: Context;
	}) {
		if (!refreshToken) {
			throw new AppError("AUTH_NO_REFRESH_PROVIDED");
		}

		const tokenData = await TokensRepository.queryTokenData(refreshToken);

		if (!tokenData) {
			throw new AppError("AUTH_INVALID_REFRESH");
		}

		if (tokenData.expiresAt < new Date()) {
			throw new AppError("AUTH_REFRESH_EXPIRED");
		}

		const user = tokenData.user;

		if (!user) {
			throw new AppError("AUTH_USER_NOT_FOUND");
		}

		const deleteRefresh = TokensRepository.deleteRefreshToken(tokenData.token);
		const queryPayload = AuthRepository.queryJWTPayloadByUserId(user.id);

		const [payload] = await Promise.all([queryPayload, deleteRefresh]);

		const jwt = signJWT({
			payload: jwtPayload.parse(payload),
		});

		const newRefreshToken = generateRefreshToken();
		await TokensService.setRefreshToken(ctx, newRefreshToken, user.id);
		TokensService.setJWTCookie(ctx, jwt);

		ctx.set.status = 200;
		return apiResponse({
			status: 200,
			error: null,
			code: "revalidate_success",
			message: "JWT revalidated successfully",
			data: {
				token: jwt,
			},
		});
	}

	static googleLogin({ ctx }: { ctx: Context }) {
		const params = {
			client_id: GOOGLE_CREDS.clientId,
			redirect_uri: GOOGLE_CREDS.redirectUri,
			response_type: "code",
			scope: "openid email profile",
		};

		const query = new URLSearchParams(params).toString();
		const url = `https://accounts.google.com/o/oauth2/v2/auth?${query}`;

		ctx.set.redirect = url;
	}

	static async googleCallback({ code, ctx }: { code: string; ctx: Context }) {
		if (!code) {
			throw new AppError("AUTH_MISSING_CODE");
		}

		try {
			const { tokens } = await client.getToken(code);
			const idToken = tokens.id_token;

			if (!idToken) {
				throw new AppError("AUTH_MISSING_ID_TOKEN");
			}

			const ticket = await client.verifyIdToken({
				idToken,
				audience: env.GOOGLE_AUTH_CLIENT_ID,
			});

			const payload = ticket.getPayload();

			const authLoginUrl = `${env.FRONTEND_URL}/auth/login`;

			if (!payload?.email) {
				ctx.cookie[cookieKey("googleAuthError")]?.set({
					value: "gacc_missing_email",
					path: "/",
					httpOnly: false,
					sameSite: "none",
					secure: true,
				});
				ctx.set.status = 302;
				ctx.set.redirect = authLoginUrl;
				return;
			}

			const user = await AuthRepository.queryUserByEmail(
				payload.email.toLowerCase()
			);

			if (!user) {
				ctx.cookie[cookieKey("googleAuthError")]?.set({
					value: "gacc_user_not_found",
					path: "/",
					httpOnly: false,
					sameSite: "none",
					secure: true,
				});
				ctx.set.status = 302;
				ctx.set.redirect = authLoginUrl;
				return;
			}

			if (!(user.verified && payload.email_verified)) {
				ctx.cookie[cookieKey("googleAuthError")]?.set({
					value: "gacc_email_not_verified",
					path: "/",
					httpOnly: false,
					sameSite: "none",
					secure: true,
				});
				ctx.set.status = 302;
				ctx.set.redirect = authLoginUrl;
				return;
			}

			await AuthRepository.updateUserWithGoogleData({
				userId: user.id,
				data: payload,
			});
			const payloadJWT = await AuthRepository.queryJWTPayloadByUserId(user.id);

			const token = signJWT({ payload: payloadJWT });

			const refreshToken = generateRefreshToken();
			await TokensService.setRefreshToken(ctx, refreshToken, user.id);
			TokensService.setJWTCookie(ctx, token);

			const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;

			ctx.set.redirect = dashboardUrl;
		} catch (err) {
			console.error(err);
			throw new AppError("AUTH_GOOGLE_FAILED");
		}
	}
}
