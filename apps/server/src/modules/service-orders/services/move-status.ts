import type { Transaction } from "@fixr/db/connection";
import type { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import type { z } from "zod";
import type { EffectContext } from "../../../core/events";
import { ServiceOrdersRepository } from "../repositories";

type ServiceOrderStatus = z.infer<typeof serviceOrderStatuses>;

/**
 * The one way to change a service order's status: update it and emit
 * `serviceOrder.statusChanged` in the same transaction, so every effect of a
 * status change (the device, later the inventory) runs whoever moved it: the
 * API or an effect of another event.
 *
 * @param emit - `events.emit` bound to `tx`, or an effect's `context.emit`
 * @param onlyFrom - move only an order currently in one of these statuses
 * @param employeeId - who moved it (none when the system did, e.g. the
 * customer approved an estimate); recorded in the order's history with `note`
 * @returns whether the status changed (the same status, or one outside
 * `onlyFrom`, changes nothing)
 */
export async function moveServiceOrder(
	tx: Transaction,
	emit: EffectContext["emit"],
	{
		serviceOrderId,
		to,
		onlyFrom,
		employeeId = null,
		note = null,
	}: {
		serviceOrderId: string;
		to: ServiceOrderStatus;
		onlyFrom?: readonly ServiceOrderStatus[];
		employeeId?: string | null;
		note?: string | null;
	}
) {
	const current = await ServiceOrdersRepository.queryStatusForUpdate(
		tx,
		serviceOrderId
	);
	if (
		!current ||
		current.status === to ||
		(onlyFrom && !onlyFrom.includes(current.status))
	) {
		return false;
	}

	await ServiceOrdersRepository.updateStatus(tx, serviceOrderId, to);
	await ServiceOrdersRepository.insertStatusHistory(tx, {
		serviceOrderId,
		fromStatus: current.status,
		toStatus: to,
		employeeId,
		note,
	});
	await emit("serviceOrder.statusChanged", {
		serviceOrderId,
		companyId: current.companyId,
		deviceId: current.deviceId,
		from: current.status,
		to,
		employeeId,
	});
	return true;
}
