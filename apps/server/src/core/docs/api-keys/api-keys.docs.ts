import { apiKeyPublicSchema } from "@fixr/db/schema";
import {
	apiKeyIdParamsSchema,
	createApiKeySchema,
	createdApiKeySchema,
} from "@fixr/schemas/api-keys";
import {
	getPaginatedDataSchema,
	paginatedDataSchema,
} from "@fixr/schemas/utils";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import { zodResponseSchema } from "../types";

const listApiKeysSchema: FastifySchema = {
	tags: ["API Keys"],
	summary: "List company API keys",
	description: `
**Retrieves the API keys of a company, paginated.**

Only the public \`prefix\` is returned: the secret is never stored in a
recoverable form and cannot be retrieved after creation.

Requires the \`apiKeys:read\` permission.
`,
	querystring: getPaginatedDataSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Company API keys successfully retrieved.",
			code: "get_company_api_keys_success",
			data: paginatedDataSchema(z.object({ ...apiKeyPublicSchema.shape })),
		}).describe("Company API keys successfully retrieved."),
		403: zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "not_allowed",
			message: "You are not allowed to access this company.",
			data: null,
		}).describe("Caller does not belong to this company."),
	},
	security: [{ JWT: [] }],
};

const createApiKeyRouteSchema: FastifySchema = {
	tags: ["API Keys"],
	summary: "Create an API key",
	description: `
**Creates a key for programmatic access to the API.**

The plaintext secret is returned **exactly once**, in this response. Store it
immediately: only its HMAC is persisted, so it can never be shown again.

Scopes may only *narrow* the creator's role. Requesting a permission the creator
does not hold is rejected with \`api_key_invalid_scopes\`. An empty scope list
means the key inherits the creator's role as-is.

Requires the \`apiKeys:create\` permission.
`,
	body: createApiKeySchema,
	response: {
		201: zodResponseSchema({
			status: 201,
			error: null,
			code: "create_api_key_success",
			message:
				"API key created successfully. Store the secret now, it will not be shown again.",
			data: createdApiKeySchema,
		}).describe("API key created successfully."),
		403: zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "api_key_invalid_scopes",
			message: "Scopes must be a subset of your own permissions.",
			data: null,
		}).describe("Requested scopes exceed the creator's permissions."),
		409: zodResponseSchema({
			status: 409,
			error: "Conflict",
			code: "api_key_name_conflict",
			message: "An active API key with this name already exists.",
			data: null,
		}).describe("An active key already uses this name."),
	},
	security: [{ JWT: [] }],
};

const revokeApiKeySchema: FastifySchema = {
	tags: ["API Keys"],
	summary: "Revoke an API key",
	description: `
**Revokes a key, immediately rejecting any request that presents it.**

Revocation is a soft delete: the row is kept so the audit trail survives.

Requires the \`apiKeys:revoke\` permission.
`,
	params: apiKeyIdParamsSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			code: "revoke_api_key_success",
			message: "API key revoked successfully.",
			data: null,
		}).describe("API key revoked successfully."),
		404: zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "api_key_not_found",
			message: "API key not found.",
			data: null,
		}).describe("API key not found in this company."),
		409: zodResponseSchema({
			status: 409,
			error: "Conflict",
			code: "api_key_already_revoked",
			message: "This API key has already been revoked.",
			data: null,
		}).describe("API key was already revoked."),
	},
	security: [{ JWT: [] }],
};

/** @description OpenAPI schemas for the API keys module */
export const apiKeysDocs = {
	listApiKeysSchema,
	createApiKeySchema: createApiKeyRouteSchema,
	revokeApiKeySchema,
};
