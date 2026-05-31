import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	getModelBySlugParamsSchema,
	getModelsQuerySchema,
} from "@fixr/schemas/models";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { ModelsService } from "../services";

/** @description Models request handlers */
export class ModelsController {
	/** @description List models with pagination and filtering */
	static listModels({
		userJwt,
		subdomain,
		page,
		perPage,
		query,
		makerId,
		categoryId,
		status,
		sort,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		response: FastifyReply;
	} & z.infer<typeof getModelsQuerySchema>) {
		return ModelsService.listModels({
			userJwt,
			subdomain,
			page,
			perPage,
			query,
			makerId,
			categoryId,
			status,
			sort,
			response,
		});
	}

	/** @description Get a model by slug with full details */
	static getModelBySlug({
		userJwt,
		subdomain,
		slug,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		slug: string;
		response: FastifyReply;
	} & z.infer<typeof getModelBySlugParamsSchema>) {
		return ModelsService.getModelBySlug({
			userJwt,
			subdomain,
			slug,
			response,
		});
	}
}
