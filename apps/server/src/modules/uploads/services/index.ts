import type { jwtPayload } from "@fixr/schemas/auth";
import type { createUploadPresignSchema } from "@fixr/schemas/uploads";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { AppError } from "../../../core/lib/app-error";
import { apiResponse } from "../../../core/lib/response";
import { UploadsRepository } from "../repositories";

/** @description Uploads business logic */
export class UploadsService {
	static async createPresignedUpload({
		userJwt,
		data,
		response,
	}: {
		userJwt: z.infer<typeof jwtPayload>;
		data: z.infer<typeof createUploadPresignSchema>;
		response: FastifyReply;
	}) {
		if (!userJwt.company) {
			throw new AppError("UPLOAD_COMPANY_NOT_FOUND");
		}

		const presign = await UploadsRepository.createPresignedUpload({
			companyId: userJwt.company.id,
			data,
		});

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: "create_upload_presign_success",
				message: "Upload URL generated successfully.",
				data: presign,
			})
		);
	}
}
