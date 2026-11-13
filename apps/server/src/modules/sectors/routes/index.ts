import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	createSectorSchema,
	patchSectorSchema,
	putStageOwnersSchema,
	sectorEmployeeParamsSchema,
	sectorIdParamsSchema,
	setEmployeeSectorSchema,
} from "@fixr/schemas/sectors";
import type { z } from "zod";
import { sectorsDocs } from "../../../core/docs/sectors.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployeeOrApiKey } from "../../../core/middlewares/authenticate-employee-or-api-key";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { SectorsController } from "../controllers";

/** @description Sectors routes plugin */
export function sectorsRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.sectors.read),
			],
			schema: sectorsDocs.listSectorsSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await SectorsController.listSectors({ userJwt, subdomain, response });
		})
	);

	fastify.post(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.sectors.create),
			],
			schema: sectorsDocs.createSectorSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const data = createSectorSchema.parse(request.body);

			await SectorsController.createSector({
				userJwt,
				subdomain,
				data,
				response,
			});
		})
	);

	fastify.get(
		"/stage-owners",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.sectors.read),
			],
			schema: sectorsDocs.listStageOwnersSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await SectorsController.listStageOwners({ userJwt, subdomain, response });
		})
	);

	fastify.put(
		"/stage-owners",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.sectors.update),
			],
			schema: sectorsDocs.putStageOwnersSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const data = putStageOwnersSchema.parse(request.body);

			await SectorsController.putStageOwners({
				userJwt,
				subdomain,
				data,
				response,
			});
		})
	);

	fastify.patch(
		"/employees/:employeeId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.sectors.update),
			],
			schema: sectorsDocs.setEmployeeSectorSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const { employeeId } = sectorEmployeeParamsSchema.parse(request.params);
			const data = setEmployeeSectorSchema.parse(request.body);

			await SectorsController.setEmployeeSector({
				userJwt,
				subdomain,
				employeeId,
				data,
				response,
			});
		})
	);

	fastify.patch(
		"/:sectorId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.sectors.update),
			],
			schema: sectorsDocs.patchSectorSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const { sectorId } = sectorIdParamsSchema.parse(request.params);
			const data = patchSectorSchema.parse(request.body);

			await SectorsController.renameSector({
				userJwt,
				subdomain,
				sectorId,
				data,
				response,
			});
		})
	);

	fastify.delete(
		"/:sectorId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.sectors.delete),
			],
			schema: sectorsDocs.deleteSectorSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const { sectorId } = sectorIdParamsSchema.parse(request.params);

			await SectorsController.deleteSector({
				userJwt,
				subdomain,
				sectorId,
				response,
			});
		})
	);
}
