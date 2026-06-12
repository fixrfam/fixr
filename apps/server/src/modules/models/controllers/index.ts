import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	createModelBodySchema,
	createModelImageBodySchema,
	getModelBySlugParamsSchema,
	getModelsQuerySchema,
	modelIdParamsSchema,
	patchModelBodySchema,
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

	/** @description Create a new model */
	static createModel({
		userJwt,
		subdomain,
		data,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		data: z.infer<typeof createModelBodySchema>;
		response: FastifyReply;
	}) {
		return ModelsService.createModel({ userJwt, subdomain, data, response });
	}

	/** @description Partially update a model */
	static patchModel({
		userJwt,
		subdomain,
		modelId,
		data,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		modelId: string;
		data: Record<string, unknown>;
		response: FastifyReply;
	} & z.infer<typeof patchModelBodySchema>) {
		return ModelsService.patchModel({
			userJwt,
			subdomain,
			modelId,
			data,
			response,
		});
	}

	/** @description Delete a model */
	static deleteModel({
		userJwt,
		subdomain,
		modelId,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		modelId: string;
		response: FastifyReply;
	} & z.infer<typeof modelIdParamsSchema>) {
		return ModelsService.deleteModel({ userJwt, subdomain, modelId, response });
	}

	/** @description Assign an uploaded image to a model */
	static createModelImage({
		userJwt,
		subdomain,
		modelId,
		data,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		modelId: string;
		data: z.infer<typeof createModelImageBodySchema>;
		response: FastifyReply;
	}) {
		return ModelsService.createModelImage({
			userJwt,
			subdomain,
			modelId,
			data,
			response,
		});
	}

	/** @description Delete a model image */
	static deleteModelImage({
		userJwt,
		subdomain,
		modelId,
		imageId,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		subdomain: string;
		modelId: string;
		imageId: string;
		response: FastifyReply;
	}) {
		return ModelsService.deleteModelImage({
			userJwt,
			subdomain,
			modelId,
			imageId,
			response,
		});
	}
}
