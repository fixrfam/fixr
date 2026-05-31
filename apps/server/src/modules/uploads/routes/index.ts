import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import {
	createModelImageUploadPresignSchema,
	createUploadPresignSchema,
} from "@fixr/schemas/uploads";
import type { z } from "zod";
import { uploadsDocs } from "../../../core/docs/uploads.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployee } from "../../../core/middlewares/authenticate-employee";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { UploadsController } from "../controllers";

export function uploadsRoutes(fastify: FastifyTypedInstance) {
	fastify.post(
		"/service-orders/presign",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.serviceOrders.update),
			],
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

	fastify.post(
		"/models/presign",
		{
			preHandler: [
				authenticateEmployee,
				requirePermission(permissions.devices.update),
			],
			schema: uploadsDocs.createModelImagePresignSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const body = createModelImageUploadPresignSchema.parse(request.body);

			await UploadsController.createModelImagePresign({
				userJwt,
				data: body,
				response,
			});
		})
	);
}
