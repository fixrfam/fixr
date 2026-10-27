import { deviceStatusFor } from "@fixr/schemas/devices";
import type { EventBus } from "../../../core/events/bus";
import { DevicesRepository } from "../repositories";

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
