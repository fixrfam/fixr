import type { CookieSerializeOptions } from "@fastify/cookie";
import { APP_NAME } from "@fixr/constants/app";
import { cookieKey } from "@fixr/constants/cookies";
import { env } from "@fixr/env/server";
import {
	emailDisplayName,
	sendAccountVerificationEmail,
} from "@fixr/mail/services";
import { jwtPayload } from "@fixr/schemas/auth";
import bcrypt from "bcryptjs";
import type { FastifyReply, FastifyRequest } from "fastify";
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

/** @description Authentication business logic */
export class AuthService {
	/**
	 * Register a new user account.
	 * Creates the user, generates a confirmation token, and sends a verification email.
	 *
	 * @param body - Registration form data
	 * @param request - Fastify request (used to build verification URL)
	 * @param response - Fastify reply
	 */
	static async register({
		body,
		request,
		response,
	}: {
		body: { email: string; displayName?: string; password: string };
		request: FastifyRequest;
		response: FastifyReply;
	}) {
		const email = body.email.toLowerCase();
		const existingEmail = await AuthRepository.queryUserByEmail(email);

		//First, check if the email is already taken
		if (existingEmail) {
			throw new AppError("AUTH_EMAIL_ALREADY_USED");
		}

		//Then hash the password and insert the user on the database
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

		const verificationUrl = `${request.protocol}://${request.host}/auth/verify?token=${encodeURIComponent(oneTimeToken.token)}&redirectUrl=${encodeURIComponent(redirectUrl)}`;

		await sendAccountVerificationEmail({
			to: newUser.email,
			appName: APP_NAME,
			verificationUrl,
			displayName: newUser.displayName ?? emailDisplayName(newUser.email),
		}).catch(async () => {
			await AuthRepository.deleteUser(newUser.id);

			throw new AppError("AUTH_VERIFICATION_EMAIL_FAILED");
		});

		return response.status(201).send(
			apiResponse({
				status: 201,
				error: null,
				code: "user_registered_success",
				message: "User registered successfully",
				data: null,
			})
		);
	}

	/**
	 * Authenticate a user with email and password.
	 * Returns JWT token and sets refresh token cookie.
	 *
	 * @param body - Login credentials
	 * @param response - Fastify reply
	 */
	static async login({
		body,
		response,
	}: {
		body: { email: string; password: string };
		response: FastifyReply;
	}) {
		const email = body.email.toLowerCase();
		//First check if the user exists

		const user = await AuthRepository.queryUserByEmail(email);

		if (!user) {
			throw new AppError("AUTH_USER_NOT_FOUND");
		}

		if (!user.verified) {
			throw new AppError("AUTH_EMAIL_NOT_VERIFIED");
		}

		//Then compares the sent password with the hashed password on the database
		const validPassword = await bcrypt.compare(
			body.password,
			user.passwordHash
		);

		if (!validPassword) {
			throw new AppError("AUTH_INVALID_PASSWORD");
		}

		const payload = await AuthRepository.queryJWTPayloadByUserId(user.id);

		//If the password is valid, sign the JWT and set the new refresh token
		const token = signJWT({
			payload: jwtPayload.parse(payload),
		});

		const refreshToken = generateRefreshToken();
		await TokensService.setRefreshToken(response, refreshToken, user.id);
		TokensService.setJWTCookie(response, token);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "login_success",
				message: "Logged in successfully",
				data: {
					token,
				},
			})
		);
	}

	/**
	 * Verify a user's email using a one-time confirmation token.
	 *
	 * @param token - The confirmation token
	 * @param redirectUrl - Optional redirect URL after verification
	 * @param response - Fastify reply
	 */
	static async verify({
		token,
		redirectUrl,
		response,
	}: {
		token: string;
		redirectUrl?: string;
		response: FastifyReply;
	}) {
		const oneTimeToken = await TokensRepository.queryOneTimeToken(token);

		//Checks if the token exists, if it's not expired and if it's a confirmation token
		if (!oneTimeToken) {
			throw new AppError("AUTH_TOKEN_NOT_FOUND");
		}
		if (oneTimeToken.expiresAt < new Date()) {
			throw new AppError("AUTH_TOKEN_EXPIRED");
		}
		if (oneTimeToken.tokenType !== "confirmation") {
			throw new AppError("AUTH_INVALID_TOKEN");
		}

		//If all checks succeed, update the user to be verified and delete the token
		const verifyUser = AuthRepository.setUserVerified(oneTimeToken.user.id);
		const deleteToken = TokensRepository.deleteOneTimeToken(oneTimeToken.token);
		await Promise.all([verifyUser, deleteToken]);

		if (redirectUrl) {
			return response
				.setCookie(cookieKey("showVerifiedDialog"), "true", {
					path: "/",
					httpOnly: false,
					sameSite: "none",
					secure: true,
				})
				.status(302)
				.redirect(decodeURIComponent(redirectUrl));
		}

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "email_verify_success",
				message: "Email verified successfully",
				data: null,
			})
		);
	}

	/**
	 * Sign out a user by deleting their refresh token from the database.
	 *
	 * @param refreshToken - The refresh token from cookies
	 * @param response - Fastify reply
	 */
	static async signOut({
		refreshToken,
		response,
	}: {
		refreshToken: string | undefined;
		response: FastifyReply;
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

		/**
		 * If all checks succeed, delete the refreshToken, which will count as a signout.
		 */
		await TokensRepository.deleteRefreshToken(tokenData.token);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "signout_success",
				message: "User signed out successfully",
				data: null,
			})
		);
	}

	/**
	 * Revalidate a JWT token using a refresh token.
	 *
	 * This is used when the JWT expires. The front-end reaches this endpoint
	 * with the refresh token to get a new JWT. This process makes sure that
	 * the JWT was not stolen, as the refresh token is stored in a secure-only cookie.
	 *
	 * @param refreshToken - The refresh token from cookies
	 * @param response - Fastify reply
	 */
	static async revalidate({
		refreshToken,
		response,
	}: {
		refreshToken: string | undefined;
		response: FastifyReply;
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

		/**
		 * If all checks succeed, delete the used refreshToken, issue a new JWT with the new payload and issue a new refreshToken
		 */
		const deleteRefresh = TokensRepository.deleteRefreshToken(tokenData.token);
		const queryPayload = AuthRepository.queryJWTPayloadByUserId(user.id);

		const [payload] = await Promise.all([queryPayload, deleteRefresh]);

		const jwt = signJWT({
			payload: jwtPayload.parse(payload),
		});

		const newRefreshToken = generateRefreshToken();
		await TokensService.setRefreshToken(response, newRefreshToken, user.id);
		TokensService.setJWTCookie(response, jwt);

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "revalidate_success",
				message: "JWT revalidated successfully",
				data: {
					token: jwt,
				},
			})
		);
	}

	/**
	 * Initiate Google OAuth2 login flow.
	 * Redirects the user to Google's consent screen.
	 *
	 * @param response - Fastify reply
	 */
	static googleLogin({ response }: { response: FastifyReply }) {
		const params = {
			client_id: GOOGLE_CREDS.clientId,
			redirect_uri: GOOGLE_CREDS.redirectUri,
			response_type: "code",
			scope: "openid email profile",
		};

		const query = new URLSearchParams(params).toString();
		const url = `https://accounts.google.com/o/oauth2/v2/auth?${query}`;

		return response.redirect(url);
	}

	/**
	 * Handle Google OAuth2 callback after user authorization.
	 *
	 * 1. Exchanges the authorization code for tokens.
	 * 2. Verifies the ID token and extracts user data.
	 * 3. Validates email exists and is verified.
	 * 4. Updates user data with latest Google profile info.
	 * 5. Generates new JWT + refresh token.
	 * 6. Sets cookies and redirects to dashboard.
	 *
	 * On error, redirects to login page with error cookie.
	 *
	 * @param code - Authorization code from Google
	 * @param response - Fastify reply
	 */
	static async googleCallback({
		code,
		response,
	}: {
		code: string;
		response: FastifyReply;
	}) {
		if (!code) {
			throw new AppError("AUTH_MISSING_CODE");
		}

		try {
			// Troca o código de autorização pelos tokens da Google
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
			const errorCookieSettings: CookieSerializeOptions = {
				path: "/",
				httpOnly: false,
				sameSite: "none",
				secure: true,
			};

			if (!payload?.email) {
				return response
					.setCookie(
						cookieKey("googleAuthError"),
						"gacc_missing_email",
						errorCookieSettings
					)
					.status(302)
					.redirect(authLoginUrl);
			}

			const user = await AuthRepository.queryUserByEmail(
				payload.email.toLowerCase()
			);

			// Apenas usuários já cadastrados conseguem acessar o sistema com o Google
			if (!user) {
				return response
					.setCookie(
						cookieKey("googleAuthError"),
						"gacc_user_not_found",
						errorCookieSettings
					)
					.status(302)
					.redirect(authLoginUrl);
			}

			if (!(user.verified && payload.email_verified)) {
				return response
					.setCookie(
						cookieKey("googleAuthError"),
						"gacc_email_not_verified",
						errorCookieSettings
					)
					.status(302)
					.redirect(authLoginUrl);
			}

			await AuthRepository.updateUserWithGoogleData({
				userId: user.id,
				data: payload,
			});
			const payloadJWT = await AuthRepository.queryJWTPayloadByUserId(user.id);

			const token = signJWT({ payload: payloadJWT });

			const refreshToken = generateRefreshToken();
			await TokensService.setRefreshToken(response, refreshToken, user.id);
			TokensService.setJWTCookie(response, token);

			const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;

			return response.redirect(dashboardUrl);
		} catch (err) {
			console.error(err);
			throw new AppError("AUTH_GOOGLE_FAILED");
		}
	}
}
