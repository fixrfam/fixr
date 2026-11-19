import type { jwtPayload } from "@fixr/schemas/auth";
import type {
	addDepartmentMembersSchema,
	createDepartmentSchema,
	getDepartmentsQuerySchema,
	patchDepartmentSchema,
	putEmployeeDepartmentsSchema,
	putStageOwnersSchema,
} from "@fixr/schemas/departments";
import type { FastifyReply } from "fastify";
import type { z } from "zod";
import { DepartmentsService } from "../services";

interface Scoped {
	userJwt: z.infer<typeof jwtPayload>;
	subdomain: string;
	response: FastifyReply;
}

/** @description Departments request handlers */
export class DepartmentsController {
	static listDepartments(
		params: Scoped & z.infer<typeof getDepartmentsQuerySchema>
	) {
		return DepartmentsService.listDepartments(params);
	}

	static getDepartment(params: Scoped & { departmentId: string }) {
		return DepartmentsService.getDepartment(params);
	}

	static createDepartment(
		params: Scoped & { data: z.infer<typeof createDepartmentSchema> }
	) {
		return DepartmentsService.createDepartment(params);
	}

	static patchDepartment(
		params: Scoped & {
			departmentId: string;
			data: z.infer<typeof patchDepartmentSchema>;
		}
	) {
		return DepartmentsService.patchDepartment(params);
	}

	static deleteDepartment(params: Scoped & { departmentId: string }) {
		return DepartmentsService.deleteDepartment(params);
	}

	static addMembers(
		params: Scoped & {
			departmentId: string;
			data: z.infer<typeof addDepartmentMembersSchema>;
		}
	) {
		return DepartmentsService.addMembers(params);
	}

	static removeMember(
		params: Scoped & { departmentId: string; employeeId: string }
	) {
		return DepartmentsService.removeMember(params);
	}

	static putEmployeeDepartments(
		params: Scoped & {
			employeeId: string;
			data: z.infer<typeof putEmployeeDepartmentsSchema>;
		}
	) {
		return DepartmentsService.putEmployeeDepartments(params);
	}

	static listStageOwners(params: Scoped) {
		return DepartmentsService.listStageOwners(params);
	}

	static putStageOwners(
		params: Scoped & { data: z.infer<typeof putStageOwnersSchema> }
	) {
		return DepartmentsService.putStageOwners(params);
	}
}
