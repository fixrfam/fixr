import type { EmployeeRole } from "@fixr/permissions";
import type {
	addDepartmentMembersSchema,
	createDepartmentSchema,
	patchDepartmentSchema,
	putStageOwnersSchema,
	stageAssigneeModes,
} from "@fixr/schemas/departments";
import type { ApiResponse, PaginatedData } from "@fixr/schemas/utils";
import type { z } from "zod";
import { axios } from "../auth/axios";
import type { ServiceOrderStatus } from "./service-orders";

/** Someone the app shows with their avatar, name and CPF. */
export interface Person {
	id: string;
	name: string;
	cpf: string;
}

export interface DepartmentRow {
	id: string;
	name: string;
	leaderId: string | null;
	leader: Person | null;
	membersCount: number;
	createdAt: string;
}

export interface DepartmentMember extends Person {
	role: EmployeeRole;
	addedAt: string;
}

export interface DepartmentDetail extends Omit<DepartmentRow, "membersCount"> {
	members: DepartmentMember[];
}

export type StageAssigneeMode = z.infer<typeof stageAssigneeModes>;

/** Which department receives an order at a stage, and who inside it. Stages missing from the list have nobody. */
export interface StageOwner {
	status: ServiceOrderStatus;
	departmentId: string;
	assigneeMode: StageAssigneeMode;
	employeeId: string | null;
}

export interface DepartmentListParams {
	page: number;
	perPage: number;
	query?: string;
	sort?: "name" | "newer" | "older";
}

async function send<T>(request: Promise<{ data: ApiResponse<T> }>) {
	const response = await request;
	return response.data.data as T;
}

const departmentsUrl = (subdomain: string) =>
	`/companies/${subdomain}/departments`;

export const departmentsApi = {
	list: (subdomain: string, params: DepartmentListParams) =>
		send<PaginatedData<DepartmentRow>>(
			axios.get(departmentsUrl(subdomain), {
				params: Object.fromEntries(
					Object.entries(params).filter(([, value]) => value !== "")
				),
			})
		),
	get: (subdomain: string, id: string) =>
		send<DepartmentDetail>(axios.get(`${departmentsUrl(subdomain)}/${id}`)),
	create: (subdomain: string, values: z.input<typeof createDepartmentSchema>) =>
		send<DepartmentDetail>(axios.post(departmentsUrl(subdomain), values)),
	update: (
		subdomain: string,
		id: string,
		values: z.input<typeof patchDepartmentSchema>
	) =>
		send<DepartmentDetail>(
			axios.patch(`${departmentsUrl(subdomain)}/${id}`, values)
		),
	remove: (subdomain: string, id: string) =>
		send<null>(axios.delete(`${departmentsUrl(subdomain)}/${id}`)),
	addMembers: (
		subdomain: string,
		id: string,
		values: z.input<typeof addDepartmentMembersSchema>
	) =>
		send<DepartmentDetail>(
			axios.post(`${departmentsUrl(subdomain)}/${id}/members`, values)
		),
	removeMember: (subdomain: string, id: string, employeeId: string) =>
		send<DepartmentDetail>(
			axios.delete(`${departmentsUrl(subdomain)}/${id}/members/${employeeId}`)
		),
	setEmployeeDepartments: (
		subdomain: string,
		employeeId: string,
		departmentIds: string[]
	) =>
		send<{ id: string; name: string }[]>(
			axios.put(`${departmentsUrl(subdomain)}/employees/${employeeId}`, {
				departmentIds,
			})
		),
	stageOwners: (subdomain: string) =>
		send<StageOwner[]>(axios.get(`${departmentsUrl(subdomain)}/stage-owners`)),
	putStageOwners: (
		subdomain: string,
		values: z.input<typeof putStageOwnersSchema>
	) =>
		send<StageOwner[]>(
			axios.put(`${departmentsUrl(subdomain)}/stage-owners`, values)
		),
};

export interface EmployeeOption extends Person {
	role: EmployeeRole;
	departments: { id: string; name: string }[];
}

/** The company's employees for pickers, searched by name or CPF. */
export const employeeOptionsApi = {
	search: (subdomain: string, query: string, perPage = 20) =>
		send<PaginatedData<EmployeeOption>>(
			axios.get(`/companies/${subdomain}/employees`, {
				params: { page: 1, perPage, ...(query ? { query } : {}) },
			})
		).then((data) => data.records),
};
