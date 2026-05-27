import type { userJWT } from "@fixr/schemas/auth";
import { createUploadPresignSchema } from "@fixr/schemas/uploads";
import type { z } from "zod";
import { uploadsDocs } from "../../../core/docs/uploads.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployee } from "../../../core/middlewares/authenticate-employee";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { UploadsController } from "../controllers";

/** @description Uploads routes plugin */
export function uploadsRoutes(fastify: FastifyTypedInstance) {
	fastify.post(
		"/presign",
		{
			preHandler: [authenticateEmployee],
			schema: uploadsDocs.createUploadPresignSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const body = await createUploadPresignSchema.parseAsync(request.body);

			await UploadsController.createPresignedUpload({
				userJwt,
				data: body,
				response,
			});
		})
	);
}
