import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	createAvatarUploadPresignSchema,
	createModelImageUploadPresignSchema,
	createUploadPresignSchema,
} from "@fixr/schemas/uploads";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { UploadsService } from "../services";

/** @description Uploads request handlers */
export class UploadsController {
	static createAvatarPresign({
		userJwt,
		data,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		data: z.infer<typeof createAvatarUploadPresignSchema>;
		response: FastifyReply;
	}) {
		return UploadsService.createAvatarPresign({
			userJwt,
			data,
			response,
		});
	}

	static createPresignedUpload({
		userJwt,
		data,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		data: z.infer<typeof createUploadPresignSchema>;
		response: FastifyReply;
	}) {
		return UploadsService.createPresignedUpload({
			userJwt,
			data,
			response,
		});
	}

	static createModelImagePresign({
		userJwt,
		data,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		data: z.infer<typeof createModelImageUploadPresignSchema>;
		response: FastifyReply;
	}) {
		return UploadsService.createModelImagePresign({
			userJwt,
			data,
			response,
		});
	}
}
