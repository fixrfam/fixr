import { oneTimeTokens } from "./../db/schema/oneTimeTokens";
import { FastifySchema } from "fastify";
import {
    changePasswordAuthenticatedSchema as changePasswordAuthenticatedBody,
    confirmPasswordResetSchema as confirmPasswordResetBody,
    requestPasswordResetSchema as requestPasswordResetBody,
} from "@repo/schemas/credentials";
import { zodResponseSchema } from "./types";
import { z } from "zod";

const changePasswordAuthenticatedSchema: FastifySchema = {
    tags: ["Credentials"],
    description: `User needs to provide the current password for the account and the new one to be set.`,
    body: changePasswordAuthenticatedBody,
    summary: "Change password authenticated",
    response: {
        404: zodResponseSchema({
            status: 404,
            error: "Not Found",
            code: "user_not_found",
            message: "User not found",
            data: null,
        }).describe("User not found."),
        401: zodResponseSchema({
            status: 401,
            error: "Unauthorized",
            code: "invalid_password",
            message: "Invalid password",
            data: null,
        }).describe("Invalid old password."),
        400: zodResponseSchema({
            status: 400,
            error: "Bad Request",
            code: "equal_passwords",
            message: "Old password and new password are the same",
            data: null,
        }).describe("Old and new password are the same."),
        200: zodResponseSchema({
            status: 200,
            error: null,
            code: "password_update_success",
            message: "Password updated successfully!",
            data: null,
        }).describe("Account password successfully updated."),
    },
    security: [{ JWT: [] }],
};

const requestPasswordResetSchema: FastifySchema = {
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
    body: requestPasswordResetBody,
    response: {
        409: zodResponseSchema({
            status: 409,
            error: "Conflict",
            code: "existing_password_reset_request",
            message:
                "Password reset request already exists. Finish it or wait until expiration (30 minutes from request) to issue a new one.",
            data: null,
        }).describe("Password reset request already exists. Only one can be up at a time."),
        404: zodResponseSchema({
            status: 404,
            error: "Not Found",
            code: "user_not_found",
            message: "User not found",
            data: null,
        }).describe("Couldn't find user."),
        201: zodResponseSchema({
            status: 201,
            error: null,
            code: "password_reset_request_accepted",
            message: "Reset request accepted, confirm email.",
            data: null,
        }).describe("Request accepted, user needs to confirm the email."),
    },
};

const confirmPasswordResetSchema: FastifySchema = {
    tags: ["Credentials"],
    description: `**Confirm the password reset of an account by changing it to a new one**
        
This endpoint receives the \`password_reset\` \`oneTimeToken\` sent to the user email along with the new password to be used.
        `,
    summary: "Confirm password reset",
    body: confirmPasswordResetBody,
    response: {
        404: zodResponseSchema({
            status: 404,
            error: "Not Found",
            code: "token_not_found",
            message: "Token not found",
            data: null,
        }).describe("Provided token was not found."),
        410: zodResponseSchema({
            status: 410,
            error: "Gone",
            code: "token_expired",
            message: "Token expired",
            data: null,
        }).describe("The token is expired."),
        400: zodResponseSchema({
            status: 400,
            error: "Bad Request",
            code: "invalid_token",
            message: "Invalid token",
            data: null,
        }).describe("The token is invalid (mismatching type, for example)."),
        200: zodResponseSchema({
            status: 200,
            error: null,
            code: "password_update_success",
            message: "Password updated successfully!",
            data: null,
        }).describe("Account password successfully updated."),
    },
};

export const validatePasswordResetTokenSchema: FastifySchema = {
    tags: ["Credentials"],
    description: `**Validates the provided password reset token**

This endpoint checks if the password reset \`oneTimeToken\` is valid, ensuring it hasn't expired, been used already, or is invalid due to other reasons. It helps prevent unauthorized or incorrect password reset attempts.

- Is used by the frontend to prevent users to acessing the reset route without a valid token.
        `,
    summary: "Validate password reset token",
    querystring: z.object({
        token: z.string(),
    }),
    response: {
        404: zodResponseSchema({
            status: 404,
            error: "Not Found",
            code: "token_not_found",
            message: "Token not found",
            data: null,
        }).describe("Provided token was not found."),
        410: zodResponseSchema({
            status: 410,
            error: "Gone",
            code: "token_expired",
            message: "Token expired",
            data: null,
        }).describe("The token is expired."),
        400: zodResponseSchema({
            status: 400,
            error: "Bad Request",
            code: "invalid_token",
            message: "Invalid token",
            data: null,
        }).describe("The token is invalid (mismatching type, for example)."),
        200: zodResponseSchema({
            status: 200,
            error: null,
            code: "password_reset_token_valid",
            message: "The provided token is a valid one.",
            data: z.object({
                valid: z.literal(true),
            }),
        }).describe("The account was successfully deleted."),
    },
};

export const credentialDocs = {
    changePasswordAuthenticatedSchema,
    requestPasswordResetSchema,
    confirmPasswordResetSchema,
    validatePasswordResetTokenSchema,
};
