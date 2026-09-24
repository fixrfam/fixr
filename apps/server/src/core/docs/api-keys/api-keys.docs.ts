import { apiKeyPublicSchema } from "@fixr/db/schema";
import {
	apiKeyIdParamsSchema,
	createApiKeySchema,
	createdApiKeySchema,
} from "@fixr/schemas/api-keys";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	getPaginatedDataSchema,
	paginatedDataSchema,
} from "@fixr/schemas/utils";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import { zodResponseSchema } from "../types";

const listApiKeysSchema: FastifySchema = {
	tags: ["API Keys"],
	summary: "List your API keys",
	description: `
**Retrieves the caller's own API keys, paginated.**

Keys are user-scoped: this never returns another employee's keys, not even for
an admin.

Only the public \`prefix\` is returned: the secret is never stored in a
recoverable form and cannot be retrieved after creation.

Requires the \`apiKeys:read\` permission, which every employee holds.
`,
	querystring: getPaginatedDataSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "API keys successfully retrieved.",
			code: "get_api_keys_success",
			data: paginatedDataSchema(z.object({ ...apiKeyPublicSchema.shape })),
		}).describe("API keys successfully retrieved."),
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

The key belongs to the employee who created it and carries that employee's
permissions. The role is resolved on every request, so demoting or removing an
employee immediately narrows every key they issued.

The plaintext secret is returned **exactly once**, in this response. Store it
immediately: only its HMAC is persisted, so it can never be shown again.

Scopes may only *narrow* the creator's role. Requesting a permission the creator
does not hold is rejected with \`api_key_invalid_scopes\`. An empty scope list
means the key inherits the creator's role as-is.

Requires the \`apiKeys:create\` permission, which every employee holds.
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
			message: "You already have an active API key with this name.",
			data: null,
		}).describe("An active key already uses this name."),
	},
	security: [{ JWT: [] }],
};

const revokeApiKeySchema: FastifySchema = {
	tags: ["API Keys"],
	summary: "Revoke one of your API keys",
	description: `
**Revokes a key, immediately rejecting any request that presents it.**

Only the caller's own keys can be revoked. A key belonging to someone else
answers \`404\`, so the endpoint cannot be used to probe for other people's key
IDs.

Revocation is a soft delete: the row is kept so the audit trail survives.

Requires the \`apiKeys:revoke\` permission, which every employee holds.
`,
	/**
	 * The route sits under `/companies/:subdomain`, so `subdomain` has to be
	 * declared here too: Fastify replaces `request.params` with whatever this
	 * schema returns, and zod strips every key it does not know about.
	 */
	params: getCompanyNestedDataSchema.extend(apiKeyIdParamsSchema.shape),
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
		}).describe("API key not found, or it belongs to another employee."),
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
