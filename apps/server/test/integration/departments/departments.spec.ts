import { describe, expect, it } from "vitest";
import {
	makeCompany,
	makeCustomer,
	makeEmployee,
	makeServiceOrder,
} from "../../factories";
import { createTestApp } from "../../helpers/app";
import { authedInject, createEmployeeSession } from "../../helpers/auth";

const app = await createTestApp();

/** A manager's session (departments:update, serviceOrders:assign) with one order. */
async function setup() {
	const { token, company, employee } = await createEmployeeSession(app, {
		role: "manager",
	});
	const customer = await makeCustomer({ companyId: company.id });
	const order = await makeServiceOrder({
		companyId: company.id,
		customerId: customer.id,
		employeeId: employee.id,
	});
	const base = `/companies/${company.subdomain}`;
	const call = (
		method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
		url: string,
		payload?: object
	) => authedInject(app, token, { method, url: `${base}${url}`, payload });

	async function createDepartment(name: string, memberIds: string[] = []) {
		const response = await call("POST", "/departments", { name });
		if (response.statusCode !== 201) {
			throw new Error(`Creating "${name}" answered ${response.statusCode}`);
		}
		const department = response.json().data as { id: string; name: string };
		if (memberIds.length > 0) {
			await call("POST", `/departments/${department.id}/members`, {
				employeeIds: memberIds,
			});
		}
		return department;
	}

	return { company, employee, order, call, createDepartment };
}

describe("departments", () => {
	it("lists departments with their leader and member count, and searches by name", async () => {
		const { employee, call, createDepartment } = await setup();
		const bench = await createDepartment("Bancada", [employee.id]);
		await createDepartment("Recepção");
		await call("PATCH", `/departments/${bench.id}`, { leaderId: employee.id });

		const all = (await call("GET", "/departments?page=1")).json().data;
		const search = (await call("GET", "/departments?page=1&query=banc")).json()
			.data;

		expect(all.records.map((row: { name: string }) => row.name)).toEqual([
			"Bancada",
			"Recepção",
		]);
		expect(search.records).toEqual([
			expect.objectContaining({
				name: "Bancada",
				membersCount: 1,
				leader: { id: employee.id, name: employee.name, cpf: employee.cpf },
			}),
		]);
	});

	it("puts an employee in several departments and refuses a leader from outside", async () => {
		const { company, employee, call, createDepartment } = await setup();
		const bench = await createDepartment("Bancada");
		const desk = await createDepartment("Recepção");
		const outsider = await makeEmployee({ company, role: "technician" });

		const set = await call("PUT", `/departments/employees/${employee.id}`, {
			departmentIds: [bench.id, desk.id],
		});
		expect(
			set
				.json()
				.data.map((row: { id: string }) => row.id)
				.sort()
		).toEqual([bench.id, desk.id].sort());

		const leader = await call("PATCH", `/departments/${bench.id}`, {
			leaderId: outsider.id,
		});
		expect(leader.json().code).toBe("department_leader_not_member");

		const detail = (await call("GET", `/departments/${desk.id}`)).json().data;
		expect(detail.members).toEqual([
			expect.objectContaining({ id: employee.id, name: employee.name }),
		]);
	});

	it("drops the lead when the leader leaves the department", async () => {
		const { employee, call, createDepartment } = await setup();
		const bench = await createDepartment("Bancada", [employee.id]);
		await call("PATCH", `/departments/${bench.id}`, { leaderId: employee.id });

		const removed = await call(
			"DELETE",
			`/departments/${bench.id}/members/${employee.id}`
		);

		expect(removed.json().data).toMatchObject({ leader: null, members: [] });
	});

	it("never touches another company's department or employee", async () => {
		const { call } = await setup();
		const other = await setup();
		const foreign = await other.createDepartment("Recepção");

		const rename = await call("PATCH", `/departments/${foreign.id}`, {
			name: "Hijacked",
		});
		const stage = await call("PUT", "/departments/stage-owners", {
			stages: [
				{
					status: "fixing",
					departmentId: foreign.id,
					assigneeMode: "pool",
					employeeId: null,
				},
			],
		});
		const members = await call("POST", `/departments/${foreign.id}/members`, {
			employeeIds: [other.employee.id],
		});
		const employee = await call(
			"PUT",
			`/departments/employees/${other.employee.id}`,
			{ departmentIds: [] }
		);

		expect(rename.statusCode).toBe(404);
		expect(stage.json().code).toBe("department_stage_owner_invalid");
		expect(members.statusCode).toBe(404);
		expect(employee.json().code).toBe("department_employee_not_found");
	});

	it("hands an order to the stage's department and leader when it enters the stage, by nobody", async () => {
		const { company, order, call, createDepartment } = await setup();
		const tech = await makeEmployee({ company, role: "technician" });
		const bench = await createDepartment("Bancada", [tech.id]);
		await call("PATCH", `/departments/${bench.id}`, { leaderId: tech.id });
		await call("PUT", "/departments/stage-owners", {
			stages: [
				{
					status: "fixing",
					departmentId: bench.id,
					assigneeMode: "leader",
					employeeId: null,
				},
			],
		});

		await call("PATCH", `/service-orders/${order.id}/status`, {
			status: "fixing",
		});
		const detail = (await call("GET", `/service-orders/${order.id}`)).json()
			.data;

		expect(detail.department).toEqual({ id: bench.id, name: "Bancada" });
		expect(detail.assignee).toEqual({
			id: tech.id,
			name: tech.name,
			cpf: tech.cpf,
		});
		expect(detail.assignments.at(-1)).toMatchObject({
			toDepartment: { id: bench.id },
			toAssignee: { id: tech.id },
			employee: null,
		});
	});

	it("reassigns by hand within the department, recording who did it, and filters the pools", async () => {
		const { company, employee, order, call, createDepartment } = await setup();
		const desk = await createDepartment("Recepção", [employee.id]);
		const outsider = await makeEmployee({ company, role: "technician" });

		const response = await call(
			"PATCH",
			`/service-orders/${order.id}/assignment`,
			{ departmentId: desk.id, assigneeId: null }
		);
		expect(response.statusCode).toBe(200);
		expect(response.json().data.assignments.at(-1)).toMatchObject({
			toDepartment: { id: desk.id },
			toAssignee: null,
			employee: { id: employee.id },
		});

		const pool = (scope: string) =>
			call("GET", `/service-orders?page=1&scope=${scope}`).then(
				(r) => r.json().data.pagination.total_records
			);
		expect(await pool("department")).toBe(1);
		expect(await pool("mine")).toBe(0);

		const notMember = await call(
			"PATCH",
			`/service-orders/${order.id}/assignment`,
			{ departmentId: desk.id, assigneeId: outsider.id }
		);
		expect(notMember.json().code).toBe(
			"service_order_assignee_not_in_department"
		);

		const foreign = await makeEmployee({ company: await makeCompany() });
		const refused = await call(
			"PATCH",
			`/service-orders/${order.id}/assignment`,
			{ departmentId: null, assigneeId: foreign.id }
		);
		expect(refused.json().code).toBe("service_order_assignee_not_found");
	});
});
