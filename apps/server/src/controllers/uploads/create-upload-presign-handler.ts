import type { jwtPayload } from "@fixr/schemas/auth";
import type { createUploadPresignSchema } from "@fixr/schemas/uploads";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { createPresignedUpload } from "@/src/services/uploads/r2-uploads.services";
import { apiResponse } from "@/src/core/lib/response";

export async function createUploadPresignHandler({
	userJwt,
	data,
	response,
}: {
	userJwt: z.infer<typeof jwtPayload>;
	data: z.infer<typeof createUploadPresignSchema>;
	response: FastifyReply;
}) {
	if (!userJwt.company) {
		return response.status(404).send(
			apiResponse({
				status: 404,
				error: "Not Found",
				code: "company_not_found",
				message: "There's no companies bound to your account",
				data: null,
			})
		);
	}

	const presign = await createPresignedUpload({
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
