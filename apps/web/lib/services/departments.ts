import type {
	createSectorSchema,
	putStageOwnersSchema,
} from "@fixr/schemas/sectors";
import type { ApiResponse } from "@fixr/schemas/utils";
import type { z } from "zod";
import { axios } from "../auth/axios";
import type { ServiceOrderStatus } from "./service-orders";

export interface Sector {
	id: string;
	name: string;
	employees: { id: string; name: string }[];
}

/** Who is responsible for a stage by default. Stages missing from the list have nobody. */
export interface StageOwner {
	status: ServiceOrderStatus;
	sectorId: string | null;
	employeeId: string | null;
}

async function send<T>(request: Promise<{ data: ApiResponse<T> }>) {
	const response = await request;
	return response.data.data as T;
}

const sectorsUrl = (subdomain: string) => `/companies/${subdomain}/sectors`;

/** Every call that changes sectors answers with the whole list. */
export const sectorsApi = {
	list: (subdomain: string) => send<Sector[]>(axios.get(sectorsUrl(subdomain))),
	create: (subdomain: string, values: z.input<typeof createSectorSchema>) =>
		send<Sector[]>(axios.post(sectorsUrl(subdomain), values)),
	rename: (
		subdomain: string,
		sectorId: string,
		values: z.input<typeof createSectorSchema>
	) =>
		send<Sector[]>(axios.patch(`${sectorsUrl(subdomain)}/${sectorId}`, values)),
	remove: (subdomain: string, sectorId: string) =>
		send<Sector[]>(axios.delete(`${sectorsUrl(subdomain)}/${sectorId}`)),
	setEmployeeSector: (
		subdomain: string,
		employeeId: string,
		sectorId: string | null
	) =>
		send<Sector[]>(
			axios.patch(`${sectorsUrl(subdomain)}/employees/${employeeId}`, {
				sectorId,
			})
		),
	stageOwners: (subdomain: string) =>
		send<StageOwner[]>(axios.get(`${sectorsUrl(subdomain)}/stage-owners`)),
	putStageOwners: (
		subdomain: string,
		values: z.input<typeof putStageOwnersSchema>
	) =>
		send<StageOwner[]>(
			axios.put(`${sectorsUrl(subdomain)}/stage-owners`, values)
		),
};

export interface EmployeeOption {
	id: string;
	name: string;
	sectorId: string | null;
}

/** The company's employees for pickers (the first 100, by the API's order). */
export const employeeOptionsApi = {
	list: (subdomain: string) =>
		send<{ records: EmployeeOption[] }>(
			axios.get(`/companies/${subdomain}/employees`, {
				params: { page: 1, perPage: 100 },
			})
		).then((data) => data.records),
};
