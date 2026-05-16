import { t } from "elysia";
import { elysiaResponseSchema } from "./types";

const errorResponse = t.Object({
	status: t.Number(),
	error: t.Union([t.String(), t.Null()]),
	message: t.String(),
	code: t.String(),
	data: t.Union([t.Null(), t.Any()]),
});

const accountSchema = t.Object({
	id: t.String(),
	email: t.String(),
	avatarUrl: t.Union([t.String(), t.Null()]),
	displayName: t.Union([t.String(), t.Null()]),
	cpf: t.String(),
	phone: t.Union([t.String(), t.Null()]),
	profileType: t.Union([t.Literal("client"), t.Literal("employee")]),
	company: t.Optional(
		t.Object({
			id: t.String(),
			name: t.String(),
			subdomain: t.String(),
			role: t.Union([
				t.Literal("guest"),
				t.Literal("technician"),
				t.Literal("warehouse"),
				t.Literal("financial"),
				t.Literal("manager"),
				t.Literal("admin"),
			]),
		})
	),
	createdAt: t.String(),
});

export const getAccountSchema = {
	detail: {
		tags: ["Account"],
		description: "Retrieves user account data",
		summary: "Get account",
	},
	response: {
		200: elysiaResponseSchema({
			status: 200,
			error: null,
			message: "Account retrieved successfully.",
			code: "get_account_success",
			data: accountSchema,
		}),
		401: errorResponse,
		403: errorResponse,
		404: errorResponse,
		500: errorResponse,
	},
};

export const requestDeletionSchema = {
	detail: {
		tags: ["Account"],
		description: `**Request account deletion and sends a confirmation email.**
    
When requested, the account is **not** deleted instantly. 
For confirmation, we generate a \`oneTimeToken\` of type \`account_deletion\`, save it on the database, and send it to the user email as a confirmation link, that will further hit the \`/account/confirm-deletion\` endpoint.

- Requests are valid for 30 minutes.
- Only one request can be up at a time.`,
		summary: "Request deletion",
	},
	response: {
		201: elysiaResponseSchema({
			status: 201,
			error: null,
			message: "Deletion request accepted, confirm email.",
			code: "deletion_request_accepted",
			data: null,
		}),
		401: errorResponse,
		403: errorResponse,
		409: errorResponse,
		500: errorResponse,
	},
};

export const confirmDeletionSchema = {
	detail: {
		tags: ["Account"],
		description: `**Confirm deletion of account corresponding to the token.**
        
When the confirmation email is sent, a link to this API route is sent together with the confirmation token.

Once clicked, the account is deleted along with the single use token, then the user is redirected to the \`redirectUrl\`.
        `,
		summary: "Confirm deletion",
	},
	response: {
		200: elysiaResponseSchema({
			status: 200,
			error: null,
			message: "Account deleted sucessfully",
			code: "account_deletion_success",
			data: null,
		}),
		302: t.Object({
			status: t.Literal(302),
			error: t.Null(),
			message: t.String(),
			code: t.String(),
			data: t.Null(),
		}),
		400: errorResponse,
		404: errorResponse,
		500: errorResponse,
	},
};

export const accountDocs = {
	getAccountSchema,
	requestDeletionSchema,
	confirmDeletionSchema,
};
