import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	createDeviceSchema,
	deviceIdParamsSchema,
	getDevicesQuerySchema,
	patchDeviceSchema,
} from "@fixr/schemas/devices";
import type { z } from "zod";
import { devicesDocs } from "../../../core/docs/devices.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployeeOrApiKey } from "../../../core/middlewares/authenticate-employee-or-api-key";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { DevicesController } from "../controllers";

/** @description Customer devices routes plugin */
export function devicesRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.devices.read),
			],
			schema: devicesDocs.listDevicesSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const query = getDevicesQuerySchema.parse(request.query);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await DevicesController.listDevices({
				userJwt,
				subdomain,
				response,
				...query,
			});
		})
	);

	fastify.get(
		"/:deviceId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.devices.read),
			],
			schema: devicesDocs.getDeviceSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { deviceId } = deviceIdParamsSchema.parse(request.params);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await DevicesController.getDevice({
				userJwt,
				subdomain,
				deviceId,
				response,
			});
		})
	);

	fastify.post(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.devices.create),
			],
			schema: devicesDocs.createDeviceSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const data = createDeviceSchema.parse(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await DevicesController.createDevice({
				userJwt,
				subdomain,
				data,
				response,
			});
		})
	);

	fastify.patch(
		"/:deviceId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.devices.update),
			],
			schema: devicesDocs.patchDeviceSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { deviceId } = deviceIdParamsSchema.parse(request.params);
			const data = patchDeviceSchema.parse(request.body);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await DevicesController.patchDevice({
				userJwt,
				subdomain,
				deviceId,
				data,
				response,
			});
		})
	);

	fastify.delete(
		"/:deviceId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.devices.delete),
			],
			schema: devicesDocs.deleteDeviceSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { deviceId } = deviceIdParamsSchema.parse(request.params);
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await DevicesController.deleteDevice({
				userJwt,
				subdomain,
				deviceId,
				response,
			});
		})
	);
}
