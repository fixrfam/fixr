import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import {
	createUploadPresignSchema,
	presignParamsSchema,
} from "@fixr/schemas/uploads";
import type { z } from "zod";
import { uploadsDocs } from "../../../core/docs/uploads.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticate } from "../../../core/middlewares/authenticate";
import { authenticateEmployeeOrApiKey } from "../../../core/middlewares/authenticate-employee-or-api-key";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { UploadsController } from "../controllers";

export function uploadsRoutes(fastify: FastifyTypedInstance) {
	fastify.post(
		"/:purpose/presign",
		{
			preHandler: async (request, reply) => {
				const { purpose } = presignParamsSchema.parse(request.params);
				if (purpose === "avatar") {
					await authenticate(request, reply);
					return;
				}
				await authenticateEmployeeOrApiKey(request, reply);
				const permission =
					purpose === "service-orders"
						? permissions.serviceOrders.update
						: permissions.devices.update;
				await new Promise<void>((resolve, reject) => {
					requirePermission(permission)(request, reply, (err) => {
						if (err) reject(err);
						else resolve();
					});
				});
			},
			schema: uploadsDocs.createPresignSchema,
		},
		withErrorHandler(async (request, response) => {
			const { purpose } = presignParamsSchema.parse(request.params);
			const body = createUploadPresignSchema.parse(request.body);
			const userJwt = request.user as z.infer<typeof userJWT>;
			await UploadsController.createPresignedUpload({
				purpose,
				data: body,
				userId: userJwt.id,
				companyId: userJwt.company?.id,
				response,
			});
		})
	);
}
