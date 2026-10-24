import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	adjustPartStockSchema,
	createPartSchema,
	getPartsQuerySchema,
	patchPartSchema,
} from "@fixr/schemas/parts";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { PartsService } from "../services";

type UserJwt = z.infer<typeof jwtPayload>;

/** @description Parts request handlers */
export class PartsController {
	static listParts(
		params: {
			userJwt: UserJwt;
			subdomain: string;
			response: FastifyReply;
		} & z.infer<typeof getPartsQuerySchema>
	) {
		return PartsService.listParts(params);
	}

	static getPart(params: {
		userJwt: UserJwt;
		subdomain: string;
		partId: string;
		response: FastifyReply;
	}) {
		return PartsService.getPart(params);
	}

	static createPart(params: {
		userJwt: UserJwt;
		subdomain: string;
		data: z.infer<typeof createPartSchema>;
		response: FastifyReply;
	}) {
		return PartsService.createPart(params);
	}

	static patchPart(params: {
		userJwt: UserJwt;
		subdomain: string;
		partId: string;
		data: z.infer<typeof patchPartSchema>;
		response: FastifyReply;
	}) {
		return PartsService.patchPart(params);
	}

	static adjustStock(params: {
		userJwt: UserJwt;
		subdomain: string;
		partId: string;
		data: z.infer<typeof adjustPartStockSchema>;
		response: FastifyReply;
	}) {
		return PartsService.adjustStock(params);
	}

	static deletePart(params: {
		userJwt: UserJwt;
		subdomain: string;
		partId: string;
		response: FastifyReply;
	}) {
		return PartsService.deletePart(params);
	}
}
