import type { userJWT } from "@fixr/schemas/auth";
import { createUploadPresignSchema } from "@fixr/schemas/uploads";
import type { z } from "zod";
import { createUploadPresignHandler } from "@/src/controllers/uploads/create-upload-presign-handler";
import { uploadsDocs } from "@/src/docs/uploads/uploads.docs";
import { FastifyTypedInstance } from "@/src/core/interfaces/fastify";
import { authenticateEmployee } from "@/src/core/middlewares/authenticate-employee";
import { withErrorHandler } from "@/src/core/middlewares/with-error-handler";

export function uploadsRoutes(fastify: FastifyTypedInstance) {
	fastify.post(
		"/presign",
		{
			preHandler: authenticateEmployee,
			schema: uploadsDocs.createUploadPresignSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const body = await createUploadPresignSchema.parseAsync(request.body);

			await createUploadPresignHandler({
				userJwt,
				data: body,
				response,
			});
		})
	);
}
