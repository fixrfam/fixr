import {
	changePasswordAuthenticatedSchema as changePasswordAuthenticatedBody,
	confirmPasswordResetSchema as confirmPasswordResetBody,
	requestPasswordResetSchema as requestPasswordResetBody,
} from "@fixr/schemas/credentials";
import { t } from "elysia";
import { elysiaResponseSchema } from "./types";

const errorResponse = t.Object({
	status: t.Number(),
	error: t.Union([t.String(), t.Null()]),
	message: t.String(),
	code: t.String(),
	data: t.Union([t.Null(), t.Any()]),
});

const validData = t.Object({ valid: t.Boolean() });

export const changePasswordAuthenticatedSchema = {
	detail: {
		tags: ["Credentials"],
		description:
			"User needs to provide the current password for the account and the new one to be set.",
		summary: "Change password authenticated",
	},
	body: changePasswordAuthenticatedBody,
	response: {
		200: elysiaResponseSchema({
			status: 200,
			error: null,
			message: "Password updated successfully!",
			code: "password_update_success",
			data: null,
		}),
		400: errorResponse,
		401: errorResponse,
		409: errorResponse,
		500: errorResponse,
	},
};

export const requestPasswordResetSchema = {
	detail: {
		tags: ["Credentials"],
		summary: "Request password reset",
		description: `
**Create a request for password reset (forgot my password) to the specified account**

If the user forget the account password, it can be reseted by hitting this endpoint with the account email.
When requested, the password is **not** reset instantly. 

For confirmation, we follow the following process:

**1.** Generate a \`oneTimeToken\` of type \`password_reset\` and save it on the database.

**2.** Send a link to the user email, that redirects to the frontend along with the generated \`oneTimeToken\`.

**3.** The \`oneTimeToken\` is then used to make a \`PUT\` on \`/credentials/password/reset\` with the new password, confirming the user is the owner of the account and resetting the password.

- Requests are valid for 30 minutes.
- Only one request can be up at a time.
    `,
	},
	body: requestPasswordResetBody,
	response: {
		201: elysiaResponseSchema({
			status: 201,
			error: null,
			message: "Reset request accepted, confirm email.",
			code: "password_reset_request_accepted",
			data: null,
		}),
		400: errorResponse,
		404: errorResponse,
		409: errorResponse,
		500: errorResponse,
	},
};

export const confirmPasswordResetSchema = {
	detail: {
		tags: ["Credentials"],
		description: `**Confirm the password reset of an account by changing it to a new one**
        
This endpoint receives the \`password_reset\` \`oneTimeToken\` sent to the user email along with the new password to be used.
        `,
		summary: "Confirm password reset",
	},
	body: confirmPasswordResetBody,
	response: {
		200: elysiaResponseSchema({
			status: 200,
			error: null,
			message: "Password updated successfully!",
			code: "password_update_success",
			data: null,
		}),
		400: errorResponse,
		404: errorResponse,
		500: errorResponse,
	},
};

export const validatePasswordResetTokenSchema = {
	detail: {
		tags: ["Credentials"],
		description: `**Validates the provided password reset token**

This endpoint checks if the password reset \`oneTimeToken\` is valid, ensuring it hasn't expired, been used already, or is invalid due to other reasons. It helps prevent unauthorized or incorrect password reset attempts.

- Is used by the frontend to prevent users to acessing the reset route without a valid token.
        `,
		summary: "Validate password reset token",
	},
	response: {
		200: elysiaResponseSchema({
			status: 200,
			error: null,
			message: "The provided token is a valid one.",
			code: "password_reset_token_valid",
			data: validData,
		}),
		400: errorResponse,
		404: errorResponse,
		500: errorResponse,
	},
};

export const credentialDocs = {
	changePasswordAuthenticatedSchema,
	requestPasswordResetSchema,
	confirmPasswordResetSchema,
	validatePasswordResetTokenSchema,
};
