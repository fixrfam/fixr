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

/** A manager's session (sectors:update, serviceOrders:assign) with one order. */
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

	async function createSector(name: string) {
		const response = await call("POST", "/sectors", { name });
		expect(response.statusCode).toBe(201);
		return response
			.json()
			.data.find((sector: { name: string }) => sector.name === name);
	}

	return { company, employee, order, call, createSector };
}

describe("sectors", () => {
	it("creates sectors, refuses a repeated name and moves employees into them", async () => {
		const { employee, call, createSector } = await setup();
		const bench = await createSector("Bancada");

		const repeated = await call("POST", "/sectors", { name: "Bancada" });
		expect(repeated.statusCode).toBe(409);
		expect(repeated.json().code).toBe("sector_name_conflict");

		const moved = await call("PATCH", `/sectors/employees/${employee.id}`, {
			sectorId: bench.id,
		});
		expect(moved.statusCode).toBe(200);
		expect(moved.json().data[0].employees).toEqual([
			{ id: employee.id, name: employee.name },
		]);
	});

	it("never touches another company's sector or employee", async () => {
		const { call } = await setup();
		const other = await setup();
		const foreign = await other.createSector("Recepção");

		const rename = await call("PATCH", `/sectors/${foreign.id}`, {
			name: "Hijacked",
		});
		const stage = await call("PUT", "/sectors/stage-owners", {
			stages: [{ status: "fixing", sectorId: foreign.id, employeeId: null }],
		});
		const employee = await call(
			"PATCH",
			`/sectors/employees/${other.employee.id}`,
			{ sectorId: null }
		);

		expect(rename.statusCode).toBe(404);
		expect(stage.json().code).toBe("sector_stage_owner_invalid");
		expect(employee.json().code).toBe("sector_employee_not_found");
	});

	it("hands an order to the stage's owner when it enters the stage, by nobody", async () => {
		const { company, order, call, createSector } = await setup();
		const bench = await createSector("Bancada");
		const tech = await makeEmployee({ company, role: "technician" });
		await call("PATCH", `/sectors/employees/${tech.id}`, {
			sectorId: bench.id,
		});
		await call("PUT", "/sectors/stage-owners", {
			stages: [{ status: "fixing", sectorId: null, employeeId: tech.id }],
		});

		await call("PATCH", `/service-orders/${order.id}/status`, {
			status: "fixing",
		});
		const detail = (await call("GET", `/service-orders/${order.id}`)).json()
			.data;

		expect(detail.sector).toEqual({ id: bench.id, name: "Bancada" });
		expect(detail.assignee).toEqual({ id: tech.id, name: tech.name });
		expect(detail.assignments.at(-1)).toMatchObject({
			toSector: { id: bench.id },
			toAssignee: { id: tech.id },
			employee: null,
		});
	});

	it("reassigns by hand, recording who did it, and filters the pools", async () => {
		const { employee, order, call, createSector } = await setup();
		const front = await createSector("Recepção");
		await call("PATCH", `/sectors/employees/${employee.id}`, {
			sectorId: front.id,
		});

		const response = await call(
			"PATCH",
			`/service-orders/${order.id}/assignment`,
			{ sectorId: front.id, assigneeId: null }
		);
		expect(response.statusCode).toBe(200);
		expect(response.json().data.assignments.at(-1)).toMatchObject({
			toSector: { id: front.id },
			toAssignee: null,
			employee: { id: employee.id },
		});

		const pool = (scope: string) =>
			call("GET", `/service-orders?page=1&scope=${scope}`).then(
				(r) => r.json().data.pagination.total_records
			);
		expect(await pool("sector")).toBe(1);
		expect(await pool("mine")).toBe(0);

		const foreign = await makeEmployee({ company: await makeCompany() });
		const refused = await call(
			"PATCH",
			`/service-orders/${order.id}/assignment`,
			{ sectorId: null, assigneeId: foreign.id }
		);
		expect(refused.json().code).toBe("service_order_assignee_not_found");
	});
});
