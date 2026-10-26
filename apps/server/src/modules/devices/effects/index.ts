import type { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import type { z } from "zod";
import type { EventBus } from "../../../core/events/bus";
import type { DeviceStatus } from "../../../core/events/catalog";
import { DevicesRepository } from "../repositories";

/** Where a device is while its service order is in a status. */
export function deviceStatusFor(
	status: z.infer<typeof serviceOrderStatuses>
): DeviceStatus {
	if (status === "delivered") {
		return "with_customer";
	}
	return status === "ready" ? "ready_for_pickup" : "in_shop";
}

/**
 * A device follows its service orders: it is in the shop from the moment an
 * order is opened, waits for pickup when the repair is ready and is back with
 * the customer once delivered.
 */
export function registerDeviceEffects(bus: EventBus) {
	bus.on("serviceOrder.opened", "devices.checkIn", ({ deviceId }, { tx }) =>
		DevicesRepository.updateDevice(
			deviceId,
			{ status: deviceStatusFor("pending") },
			tx
		)
	);

	bus.on(
		"serviceOrder.statusChanged",
		"devices.followServiceOrder",
		({ deviceId, to }, { tx }) =>
			DevicesRepository.updateDevice(
				deviceId,
				{ status: deviceStatusFor(to) },
				tx
			)
	);
}
