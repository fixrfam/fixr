import type { Transaction } from "@fixr/db/connection";
import type { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import type { z } from "zod";
import type { EventBus } from "../../../core/events/bus";
import { assignServiceOrder } from "../../service-orders/services/assign";
import { DepartmentsRepository } from "../repositories";

/**
 * Hand the order to the department that owns the stage it entered, if the
 * stage has one, and inside it to the pool, the leader (the pool when there's
 * none) or the stage's employee (the pool when they left the department).
 * Recorded as done by nobody.
 */
export async function routeToStageOwner(
	tx: Transaction,
	{
		serviceOrderId,
		companyId,
		status,
	}: {
		serviceOrderId: string;
		companyId: string;
		status: z.infer<typeof serviceOrderStatuses>;
	}
) {
	const owner = await DepartmentsRepository.queryStageOwner(
		tx,
		companyId,
		status
	);
	if (!owner) {
		return;
	}

	let assigneeId: string | null = null;
	if (owner.assigneeMode === "leader") {
		assigneeId = owner.leaderId;
	} else if (
		owner.assigneeMode === "employee" &&
		owner.employeeId &&
		(await DepartmentsRepository.isMember(
			owner.departmentId,
			owner.employeeId,
			tx
		))
	) {
		assigneeId = owner.employeeId;
	}

	await assignServiceOrder(tx, {
		serviceOrderId,
		departmentId: owner.departmentId,
		assigneeId,
	});
}

/** A service order goes to whoever owns each stage it enters, starting with the opening. */
export function registerDepartmentEffects(bus: EventBus) {
	bus.on(
		"serviceOrder.opened",
		"departments.routeToStageOwner",
		({ serviceOrderId, companyId }, { tx }) =>
			routeToStageOwner(tx, { serviceOrderId, companyId, status: "pending" })
	);

	bus.on(
		"serviceOrder.statusChanged",
		"departments.routeToStageOwner",
		({ serviceOrderId, companyId, to }, { tx }) =>
			routeToStageOwner(tx, { serviceOrderId, companyId, status: to })
	);
}
