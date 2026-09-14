import type { createApiKeySchema } from "@fixr/schemas/api-keys";
import type { jwtPayload } from "@fixr/schemas/auth";
import type { getPaginatedDataSchema } from "@fixr/schemas/utils";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { ApiKeysService } from "../services";

/** @description API keys request handlers */
export class ApiKeysController {
	/**
	 * @description Get the caller's own paginated API keys
	 */
	static getOwnApiKeys({
		subdomain,
		userJwt,
		page,
		perPage,
		query,
		sort,
		response,
	}: {
		subdomain: string;
		userJwt: z.infer<typeof jwtPayload>;
		response: FastifyReply;
	} & z.infer<typeof getPaginatedDataSchema>) {
		return ApiKeysService.getOwnApiKeys({
			subdomain,
			userJwt,
			page,
			perPage,
			query,
			sort,
			response,
		});
	}

	/**
	 * @description Create a new API key
	 */
	static createApiKey({
		userJwt,
		subdomain,
		data,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		data: z.infer<typeof createApiKeySchema>;
		response: FastifyReply;
	}) {
		return ApiKeysService.createApiKey({
			userJwt,
			subdomain,
			data,
			response,
		});
	}

	/**
	 * @description Revoke an API key
	 */
	static revokeApiKey({
		userJwt,
		subdomain,
		apiKeyId,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		apiKeyId: string;
		response: FastifyReply;
	}) {
		return ApiKeysService.revokeApiKey({
			userJwt,
			subdomain,
			apiKeyId,
			response,
		});
	}
}
