import type { getModelMakersQuerySchema } from "@fixr/schemas/models";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { MakersService } from "../services";

/** @description Makers request handlers */
export class MakersController {
	/** @description List makers with pagination */
	static listMakers({
		page,
		perPage,
		query,
		sort,
		response,
	}: {
		page: number;
		perPage?: number;
		query?: string;
		sort?: string;
		response: FastifyReply;
	} & z.infer<typeof getModelMakersQuerySchema>) {
		return MakersService.listMakers({
			page,
			perPage,
			query,
			sort,
			response,
		});
	}

	/** @description Get a maker by slug */
	static getMakerBySlug({
		slug,
		response,
	}: {
		slug: string;
		response: FastifyReply;
	}) {
		return MakersService.getMakerBySlug({ slug, response });
	}
}
