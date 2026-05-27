import { db, eq } from "@fixr/db/connection";
import { employees } from "@fixr/db/schema";
import type { jwtPayload } from "@fixr/schemas/auth";
import type { createUploadPresignSchema } from "@fixr/schemas/uploads";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { AppError } from "../../../core/lib/app-error";
import { apiResponse } from "../../../core/lib/response";
import { UploadsRepository } from "../repositories";

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

		const [employee] = await db
			.select()
			.from(employees)
			.where(eq(employees.userId, userJwt.id))
			.limit(1);

		if (!employee || employee.companyId !== userJwt.company.id) {
			throw new AppError("UPLOAD_COMPANY_NOT_FOUND");
		}

		const presign = await UploadsRepository.createPresignedUpload({
			companyId: userJwt.company.id,
			employeeId: employee.id,
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
