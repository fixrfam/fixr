import type { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import type { z } from "zod";
import type { EventBus } from "../../../core/events/bus";
import { moveServiceOrder } from "../services/move-status";

/**
 * Statuses that come before the customer's answer. Sending or approving an
 * estimate only moves orders still in one of these, so an order already being
 * fixed or delivered is never pushed back.
 */
export const BEFORE_APPROVAL: readonly z.infer<typeof serviceOrderStatuses>[] =
	["pending", "diagnosing", "waiting_approval"];

/**
 * A service order follows its estimate: it waits for approval once the
 * estimate is sent and is approved with it. Both go through
 * `moveServiceOrder`, so the effects of a status change run too.
 */
export function registerServiceOrderEffects(bus: EventBus) {
	bus.on(
		"estimate.sent",
		"serviceOrders.awaitApproval",
		({ serviceOrderId }, { tx, emit }) =>
			moveServiceOrder(tx, emit, {
				serviceOrderId,
				to: "waiting_approval",
				onlyFrom: BEFORE_APPROVAL,
			}).then(() => undefined)
	);

	bus.on(
		"estimate.approved",
		"serviceOrders.approve",
		({ serviceOrderId }, { tx, emit }) =>
			moveServiceOrder(tx, emit, {
				serviceOrderId,
				to: "approved",
				onlyFrom: BEFORE_APPROVAL,
			}).then(() => undefined)
	);
}
