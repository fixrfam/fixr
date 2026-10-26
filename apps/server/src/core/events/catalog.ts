import type { deviceStatuses } from "@fixr/schemas/devices";
import type { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import type { z } from "zod";

type ServiceOrderStatus = z.infer<typeof serviceOrderStatuses>;
export type DeviceStatus = z.infer<typeof deviceStatuses>;

/**
 * Every domain event, by name, with its payload.
 *
 * An event is a fact that already happened (past tense), described by the
 * module that owns the data. It carries ids and the values effects need, not
 * whole records: effects load anything else themselves, in the same
 * transaction. See `README.md` next to this file before adding one.
 */
export interface DomainEvents {
	/** A service order was opened for a customer's device (the device was dropped off). */
	"serviceOrder.opened": {
		serviceOrderId: string;
		companyId: string;
		deviceId: string;
		employeeId: string;
	};
	/** A service order moved from one status to another. */
	"serviceOrder.statusChanged": {
		serviceOrderId: string;
		companyId: string;
		deviceId: string;
		from: ServiceOrderStatus;
		to: ServiceOrderStatus;
	};
}

export type EventName = keyof DomainEvents;
