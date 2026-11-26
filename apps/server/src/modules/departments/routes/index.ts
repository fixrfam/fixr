import { permissions } from "@fixr/permissions";
import type { userJWT } from "@fixr/schemas/auth";
import { getCompanyNestedDataSchema } from "@fixr/schemas/companies";
import {
	addDepartmentMembersSchema,
	createDepartmentSchema,
	departmentIdParamsSchema,
	departmentMemberParamsSchema,
	employeeDepartmentsParamsSchema,
	getDepartmentsQuerySchema,
	patchDepartmentSchema,
	putEmployeeDepartmentsSchema,
	putStageOwnersSchema,
} from "@fixr/schemas/departments";
import type { z } from "zod";
import { departmentsDocs } from "../../../core/docs/departments.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { authenticateEmployeeOrApiKey } from "../../../core/middlewares/authenticate-employee-or-api-key";
import { requirePermission } from "../../../core/middlewares/rbac";
import { withErrorHandler } from "../../../core/middlewares/with-error-handler";
import { DepartmentsController } from "../controllers";

/** @description Departments routes plugin */
export function departmentsRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.departments.read),
			],
			schema: departmentsDocs.listDepartmentsSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const query = getDepartmentsQuerySchema.parse(request.query);

			await DepartmentsController.listDepartments({
				userJwt,
				subdomain,
				...query,
				response,
			});
		})
	);

	fastify.post(
		"/",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.departments.create),
			],
			schema: departmentsDocs.createDepartmentSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const data = createDepartmentSchema.parse(request.body);

			await DepartmentsController.createDepartment({
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
				requirePermission(permissions.departments.read),
			],
			schema: departmentsDocs.listStageOwnersSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);

			await DepartmentsController.listStageOwners({
				userJwt,
				subdomain,
				response,
			});
		})
	);

	fastify.put(
		"/stage-owners",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.departments.update),
			],
			schema: departmentsDocs.putStageOwnersSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const data = putStageOwnersSchema.parse(request.body);

			await DepartmentsController.putStageOwners({
				userJwt,
				subdomain,
				data,
				response,
			});
		})
	);

	fastify.put(
		"/employees/:employeeId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.departments.update),
			],
			schema: departmentsDocs.putEmployeeDepartmentsSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const { employeeId } = employeeDepartmentsParamsSchema.parse(
				request.params
			);
			const data = putEmployeeDepartmentsSchema.parse(request.body);

			await DepartmentsController.putEmployeeDepartments({
				userJwt,
				subdomain,
				employeeId,
				data,
				response,
			});
		})
	);

	fastify.get(
		"/:departmentId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.departments.read),
			],
			schema: departmentsDocs.getDepartmentSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const { departmentId } = departmentIdParamsSchema.parse(request.params);

			await DepartmentsController.getDepartment({
				userJwt,
				subdomain,
				departmentId,
				response,
			});
		})
	);

	fastify.patch(
		"/:departmentId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.departments.update),
			],
			schema: departmentsDocs.patchDepartmentSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const { departmentId } = departmentIdParamsSchema.parse(request.params);
			const data = patchDepartmentSchema.parse(request.body);

			await DepartmentsController.patchDepartment({
				userJwt,
				subdomain,
				departmentId,
				data,
				response,
			});
		})
	);

	fastify.delete(
		"/:departmentId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.departments.delete),
			],
			schema: departmentsDocs.deleteDepartmentSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const { departmentId } = departmentIdParamsSchema.parse(request.params);

			await DepartmentsController.deleteDepartment({
				userJwt,
				subdomain,
				departmentId,
				response,
			});
		})
	);

	fastify.post(
		"/:departmentId/members",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.departments.update),
			],
			schema: departmentsDocs.addDepartmentMembersSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const { departmentId } = departmentIdParamsSchema.parse(request.params);
			const data = addDepartmentMembersSchema.parse(request.body);

			await DepartmentsController.addMembers({
				userJwt,
				subdomain,
				departmentId,
				data,
				response,
			});
		})
	);

	fastify.delete(
		"/:departmentId/members/:employeeId",
		{
			preHandler: [
				authenticateEmployeeOrApiKey,
				requirePermission(permissions.departments.update),
			],
			schema: departmentsDocs.removeDepartmentMemberSchema,
		},
		withErrorHandler(async (request, response) => {
			const userJwt = request.user as z.infer<typeof userJWT>;
			const { subdomain } = getCompanyNestedDataSchema.parse(request.params);
			const { departmentId, employeeId } = departmentMemberParamsSchema.parse(
				request.params
			);

			await DepartmentsController.removeMember({
				userJwt,
				subdomain,
				departmentId,
				employeeId,
				response,
			});
		})
	);
}
