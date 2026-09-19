import { and, db, eq } from "@fixr/db/connection";
import { employees } from "@fixr/db/schema";
import type {
	createUploadPresignSchema,
	uploadPurpose,
} from "@fixr/schemas/uploads";
import { MAX_AVATAR_UPLOAD_SIZE_BYTES } from "@fixr/schemas/uploads";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { AppError } from "../../../core/lib/app-error";
import { apiResponse } from "../../../core/lib/response";
import { UploadsRepository } from "../repositories";

const SUCCESS_CODES: Record<z.infer<typeof uploadPurpose>, string> = {
	avatar: "create_avatar_presign_success",
	"service-orders": "create_upload_presign_success",
	models: "create_model_image_presign_success",
};

export class UploadsService {
	static async createPresignedUpload({
		purpose,
		data,
		userId,
		companyId,
		response,
	}: {
		purpose: z.infer<typeof uploadPurpose>;
		data: z.infer<typeof createUploadPresignSchema>;
		userId: string;
		companyId?: string;
		response: FastifyReply;
	}) {
		if (purpose === "avatar" && data.size > MAX_AVATAR_UPLOAD_SIZE_BYTES) {
			throw new AppError("UPLOAD_SIZE_EXCEEDED");
		}

		let employeeId: string | undefined;

		if (companyId) {
			const [employee] = await db
				.select({ id: employees.id })
				.from(employees)
				.where(
					and(eq(employees.userId, userId), eq(employees.companyId, companyId))
				)
				.limit(1);

			if (!employee) {
				throw new AppError("UPLOAD_COMPANY_NOT_FOUND");
			}

			employeeId = employee.id;
		}

		const result = await UploadsRepository.createPresignedUpload({
			purpose,
			companyId: purpose === "avatar" ? undefined : companyId,
			employeeId,
			userId,
			fileName: data.fileName,
			contentType: data.contentType,
			size: data.size,
		});

		return response.status(200).send(
			apiResponse({
				status: 200,
				error: null,
				code: SUCCESS_CODES[purpose],
				message: "Upload URL generated successfully.",
				data: result,
			})
		);
	}
}
