import { createUserSchema, loginUserSchema } from "@fixr/schemas/auth";
import { t } from "elysia";
import { elysiaResponseSchema, errorResponse, errorResponses } from "./types";

const tokenData = t.Object({ token: t.String() });

const loginConfig = {
	detail: {
		tags: ["Auth"],
		description: `
Login into the system. Returns a \`JWT\` and sets a \`refreshToken\` cookie on the client.
        
See [cookie naming conventions](/docs/#description/cookies) for more info.`,
		summary: "Login",
	},
	body: loginUserSchema,
	response: {
		200: elysiaResponseSchema({
			status: 200,
			error: null,
			message: "Logged in successfully",
			code: "login_success",
			data: tokenData,
		}),
		401: errorResponses("AUTH_JWT_INVALID", "AUTH_INVALID_PASSWORD"),
		403: errorResponse("AUTH_EMAIL_NOT_VERIFIED"),
		404: errorResponse("AUTH_USER_NOT_FOUND"),
		500: errorResponse("INTERNAL_ERROR"),
	},
};

const revalidateConfig = {
	detail: {
		tags: ["Auth"],
		description: `**Sends a new \`JWT\` for the provided user.**
        
Needs a \`refreshToken\` cookie, received from \`/auth/login\`, to succeed.

This should be used when the short lived \`JWT\` expires.

Will invalidate the passed \`refreshToken\` if all checks succeed and return a new one.     

See [cookie naming conventions](/docs/#description/cookies) for more info.
        `,
		summary: "Revalidate JWT",
	},
	response: {
		200: elysiaResponseSchema({
			status: 200,
			error: null,
			message: "JWT revalidated successfully",
			code: "revalidate_success",
			data: tokenData,
		}),
		400: errorResponse("AUTH_NO_REFRESH_PROVIDED"),
		401: errorResponse("AUTH_INVALID_REFRESH"),
		404: errorResponse("AUTH_USER_NOT_FOUND"),
		500: errorResponse("INTERNAL_ERROR"),
	},
};

const verifyConfig = {
	detail: {
		tags: ["Auth"],
		description: `**Verifies the user corresponding to the token.**
        
When the confirmation email is sent, a link to this API route is sent together with the confirmation token.

Once clicked, the email is confirmed and the single use token is deleted, then the user is redirected to the \`redirectUrl\`.
        `,
		summary: "Verify email",
	},
	response: {
		200: elysiaResponseSchema({
			status: 200,
			error: null,
			message: "Email verified successfully",
			code: "email_verify_success",
			data: null,
		}),
		302: t.Object({
			status: t.Literal(302),
			error: t.Null(),
			message: t.String(),
			code: t.String(),
			data: t.Null(),
		}),
		400: errorResponse("AUTH_INVALID_TOKEN"),
		404: errorResponse("AUTH_TOKEN_NOT_FOUND"),
		500: errorResponse("INTERNAL_ERROR"),
	},
};

const signOutConfig = {
	detail: {
		tags: ["Auth"],
		description: `**Signs-out the user server-side**
        
This route deletes the user \`refreshToken\` on the database, meaning that he is now "signed-out".

The frontend should then redirect the user to the login page, while deleting the cookies that it has stored. 

See [cookie naming conventions](/docs/#description/cookies) for more info.

PS: Signout **do not** require authentication. This allow us to hit this route on middlewares to invalidate the \`refreshToken\` on the DB
for users that are trying to request a new \`JWT\` when their \`refreshToken\` has expired.
        `,
		summary: "Signout",
	},
	response: {
		200: elysiaResponseSchema({
			status: 200,
			error: null,
			message: "User signed out successfully",
			code: "signout_success",
			data: null,
		}),
		400: errorResponse("AUTH_NO_REFRESH_PROVIDED"),
		404: errorResponse("AUTH_USER_NOT_FOUND"),
		500: errorResponse("INTERNAL_ERROR"),
	},
};

const googleLoginConfig = {
	detail: {
		tags: ["Auth"],
		summary: "Start Google OAuth",
		description: `
**Redirects the user to Google's OAuth 2.0 authorization page.**

This route initiates the Google login process by redirecting the user to the Google consent screen.  
After granting permissions, Google redirects back to \`/auth/google/callback\` with an authorization \`code\`.

No authentication or body parameters are required.`,
	},
	response: {
		302: t.Object({
			status: t.Literal(302),
			error: t.Null(),
			message: t.String(),
			code: t.String(),
			data: t.Null(),
		}),
	},
};

const googleCallbackConfig = {
	detail: {
		tags: ["Auth"],
		summary: "Handle Google OAuth callback",
		description: `
**Handles the redirect from Google after user authorization.**

This endpoint exchanges the received \`code\` for tokens, verifies the ID token, and:
- Validates the user email.
- Checks if the user exists and is verified.
- Syncs Google data with the user profile.
- Issues a new JWT and refresh token.
- Redirects to the dashboard on success.

In case of errors (missing email, unverified email, etc.), it sets a cookie with the error code (\`googleAuthError\`) and redirects the user back to \`/auth/login\`.`,
	},
	response: {
		302: t.Object({
			status: t.Literal(302),
			error: t.Null(),
			message: t.String(),
			code: t.String(),
			data: t.Null(),
		}),
		500: errorResponse("INTERNAL_ERROR"),
	},
};

export const authDocs = {
	registerSchema: {
		detail: {
			tags: ["Auth"],
			description: `
**Register a user onto the system and sends a confirmation email.**
    
When registered, the user is still **not** verified. 
For this, we generate a \`oneTimeToken\`, save it on the database, and send it to the user email as a confirmation link, that will further hit the \`/auth/verify\` endpoint.`,
			summary: "Create account",
		},
		body: createUserSchema,
		response: {
			201: elysiaResponseSchema({
				status: 201,
				error: null,
				message: "User registered successfully",
				code: "user_registered_success",
				data: null,
			}),
			400: errorResponse("BAD_REQUEST"),
			409: errorResponse("AUTH_EMAIL_ALREADY_USED"),
			500: errorResponse("INTERNAL_ERROR"),
		},
	},
	loginConfig,
	revalidateConfig,
	verifyConfig,
	signOutConfig,
	googleLoginConfig,
	googleCallbackConfig,
};
