import type { Transaction } from "@fixr/db/connection";
import type { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import type { z } from "zod";
import type { EventBus } from "../../../core/events/bus";
import { assignServiceOrder } from "../../service-orders/services/assign";
import { SectorsRepository } from "../repositories";

/**
 * Hand the order to the default owner of the stage it entered, if the stage
 * has one: its sector's pool and, when set, its employee (whose sector the
 * order goes to when the stage names no sector). Recorded as done by nobody.
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
	const owner = await SectorsRepository.queryStageOwner(tx, companyId, status);
	if (!(owner?.sectorId || owner?.employeeId)) {
		return;
	}

	const employee = owner.employeeId
		? await SectorsRepository.queryEmployeeOfCompany(
				owner.employeeId,
				companyId,
				tx
			)
		: null;

	await assignServiceOrder(tx, {
		serviceOrderId,
		sectorId: owner.sectorId ?? employee?.sectorId ?? null,
		assigneeId: employee?.id ?? null,
	});
}

/** A service order goes to whoever owns each stage it enters, starting with the opening. */
export function registerSectorEffects(bus: EventBus) {
	bus.on(
		"serviceOrder.opened",
		"sectors.routeToStageOwner",
		({ serviceOrderId, companyId }, { tx }) =>
			routeToStageOwner(tx, { serviceOrderId, companyId, status: "pending" })
	);

	bus.on(
		"serviceOrder.statusChanged",
		"sectors.routeToStageOwner",
		({ serviceOrderId, companyId, to }, { tx }) =>
			routeToStageOwner(tx, { serviceOrderId, companyId, status: to })
	);
}
